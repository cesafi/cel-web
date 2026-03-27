import { NextRequest, NextResponse } from 'next/server';
import { StandingsService } from '@/services/standings';
import { row, emptyRow, csvHeaders } from '@/lib/utils/csv-helpers';
import {
    GroupStageStandings,
    BracketStandings,
    BracketMatch,
    TeamStanding,
} from '@/lib/types/standings';

const N = 'None';
const MAX_TEAMS = 12;

/**
 * Export: Standings CSV — 15 columns (A–O)
 *
 * Uses StandingsService for real standings data matching the standings page.
 * Supports round_robin (groups), single_elimination, and double_elimination.
 *
 * Required params: seasonId, sportId, categoryId
 * Optional: stageId
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;
        let sportId = searchParams.get('sportId') ? parseInt(searchParams.get('sportId')!) : undefined;
        const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
        const stageId = searchParams.get('stageId') ? parseInt(searchParams.get('stageId')!) : undefined;
        const game = searchParams.get('game') as 'mlbb' | 'valorant' | null;

        // Resolve sportId from game name if not provided
        if (!sportId && game) {
            const supabase = (await import('@/lib/supabase/server')).getSupabaseServer;
            const sb = await supabase();
            const gameName = game === 'mlbb' ? 'Mobile Legends' : 'Valorant';
            const { data: esport } = await sb
                .from('esports')
                .select('id')
                .ilike('name', `%${gameName}%`)
                .limit(1)
                .single();
            if (esport) sportId = esport.id;
        }

        if (!seasonId || !sportId || !categoryId) {
            return new NextResponse(
                row(['', '', '', '', '', '', '', 'STANDINGS — Missing seasonId, sportId, or categoryId', '', '', '', '', '', '', '']),
                { status: 200, headers: csvHeaders('standings') }
            );
        }

        const result = await StandingsService.getStandings({
            season_id: seasonId,
            sport_id: sportId,
            esport_category_id: categoryId,
            stage_id: stageId,
        });

        if (!result.success || !result.data) {
            return new NextResponse(
                row(['', '', '', '', '', '', '', 'NO STANDINGS DATA', '', '', '', '', '', '', '']),
                { status: 200, headers: csvHeaders('standings') }
            );
        }

        const { navigation, standings } = result.data;
        const esportName = navigation.sport.name?.toUpperCase() || '';
        const categoryLabel = `${navigation.category.division} ${navigation.category.levels}`.trim().toUpperCase();
        const isValorant = esportName.toLowerCase().includes('valorant');

        let csv = '';

        // ═══════ ROUND ROBIN / GROUP STAGE ═══════
        if (standings.competition_stage === 'group_stage') {
            const gs = standings as GroupStageStandings;

            // Title
            csv += row(['', '', '', '', '', '', '', `${esportName} STANDINGS`, '', '', '', '', '', '', '']);
            csv += row(['', '', '', '', '', '', '', `${categoryLabel} — ${gs.stage_name?.replace(/_/g, ' ').toUpperCase() || 'GROUP STAGE'}`, '', '', '', '', '', '', '']);
            csv += emptyRow();

            for (const group of gs.groups) {
                // Group header
                csv += row(['', group.group_name?.toUpperCase() || 'GROUP', '', '', '', '', '', '', '', '', '', '', '', '', '']);

                // Column headers — simplified for round robin
                if (isValorant) {
                    // Rank, Team Abbrev, Team Name, W-D-L, Pts, Round Diff
                    csv += row(['RANK', 'ABBREV', 'TEAM NAME', 'W', 'D', 'L', 'PTS', 'ROUND DIFF', '', '', '', '', '', '', '']);
                } else {
                    // Rank, Team Abbrev, Team Name, W-D-L, Pts, Avg Win Duration
                    csv += row(['RANK', 'ABBREV', 'TEAM NAME', 'W', 'D', 'L', 'PTS', 'AVG WIN TIME', '', '', '', '', '', '', '']);
                }

                // Team rows (capped)
                const teams = group.teams.slice(0, MAX_TEAMS);
                for (let i = 0; i < MAX_TEAMS; i++) {
                    const t = teams[i] as TeamStanding | undefined;
                    if (!t) {
                        csv += row([i + 1, N, N, N, N, N, N, N, '', '', '', '', '', '', '']);
                        continue;
                    }

                    if (isValorant) {
                        const rd = (t.round_difference ?? 0);
                        const rdStr = rd >= 0 ? `+${rd}` : String(rd);
                        csv += row([
                            t.position,
                            t.school_abbreviation || N,
                            t.school_name || N,
                            t.wins,
                            t.draws,
                            t.losses,
                            t.points,
                            rdStr,
                            '', '', '', '', '', '', '',
                        ]);
                    } else {
                        csv += row([
                            t.position,
                            t.school_abbreviation || N,
                            t.school_name || N,
                            t.wins,
                            t.draws,
                            t.losses,
                            t.points,
                            t.avg_win_duration || '-',
                            '', '', '', '', '', '', '',
                        ]);
                    }
                }

                csv += emptyRow();
            }
        }

        // ═══════ ELIMINATION BRACKETS ═══════
        else if (standings.competition_stage === 'playoffs' || standings.competition_stage === 'elimination') {
            const bs = standings as BracketStandings;

            csv += row(['', '', '', '', '', '', '', `${esportName} BRACKET`, '', '', '', '', '', '', '']);
            csv += row(['', '', '', '', '', '', '', `${categoryLabel} — ${bs.stage_name?.replace(/_/g, ' ').toUpperCase() || 'PLAYOFFS'}`, '', '', '', '', '', '', '']);
            csv += emptyRow();

            // Group bracket matches by round
            const rounds = new Map<number, BracketMatch[]>();
            for (const m of bs.bracket) {
                if (!rounds.has(m.round)) rounds.set(m.round, []);
                rounds.get(m.round)!.push(m);
            }

            // Check for upper/lower bracket (double elim)
            const hasGroups = bs.bracket.some(m => m.group_name);

            if (hasGroups) {
                // Double elimination — separate upper/lower
                const upperMatches = bs.bracket.filter(m => (m.group_name || '').toLowerCase().includes('upper') || (m.group_name || '').toLowerCase().includes('winner'));
                const lowerMatches = bs.bracket.filter(m => (m.group_name || '').toLowerCase().includes('lower') || (m.group_name || '').toLowerCase().includes('loser'));
                const otherMatches = bs.bracket.filter(m => !upperMatches.includes(m) && !lowerMatches.includes(m));

                const renderBracketSection = (title: string, matches: BracketMatch[]) => {
                    if (matches.length === 0) return;
                    csv += row(['', title, '', '', '', '', '', '', '', '', '', '', '', '', '']);
                    csv += row(['MATCH', 'TEAM 1 ABBR', 'TEAM 1 SCHOOL', 'SCORE', 'VS', 'SCORE', 'TEAM 2 ABBR', 'TEAM 2 SCHOOL', 'WINNER', 'STATUS', '', '', '', '', '']);

                    // Sort by round then position
                    const sorted = [...matches].sort((a, b) => a.round !== b.round ? a.round - b.round : a.position - b.position);
                    for (const m of sorted) {
                        csv += row([
                            m.match_name || `R${m.round}M${m.position}`,
                            m.team1?.school_abbreviation || 'TBD',
                            m.team1?.school_name || 'TBD',
                            m.team1?.score ?? '-',
                            'vs',
                            m.team2?.score ?? '-',
                            m.team2?.school_abbreviation || 'TBD',
                            m.team2?.school_name || 'TBD',
                            m.winner?.school_abbreviation || '-',
                            m.match_status?.toUpperCase() || '',
                            '', '', '', '', '',
                        ]);
                    }
                    csv += emptyRow();
                };

                renderBracketSection('UPPER BRACKET', upperMatches);
                renderBracketSection('LOWER BRACKET', lowerMatches);
                if (otherMatches.length > 0) renderBracketSection('GRAND FINALS', otherMatches);
            } else {
                // Single elimination — by round
                csv += row(['MATCH', 'TEAM 1 ABBR', 'TEAM 1 SCHOOL', 'SCORE', 'VS', 'SCORE', 'TEAM 2 ABBR', 'TEAM 2 SCHOOL', 'WINNER', 'STATUS', '', '', '', '', '']);

                for (const [roundNum, roundMatches] of [...rounds.entries()].sort(([a], [b]) => a - b)) {
                    csv += row(['', `ROUND ${roundNum}`, '', '', '', '', '', '', '', '', '', '', '', '', '']);
                    const sorted = [...roundMatches].sort((a, b) => a.position - b.position);
                    for (const m of sorted) {
                        csv += row([
                            m.match_name || `R${m.round}M${m.position}`,
                            m.team1?.school_abbreviation || 'TBD',
                            m.team1?.school_name || 'TBD',
                            m.team1?.score ?? '-',
                            'vs',
                            m.team2?.score ?? '-',
                            m.team2?.school_abbreviation || 'TBD',
                            m.team2?.school_name || 'TBD',
                            m.winner?.school_abbreviation || '-',
                            m.match_status?.toUpperCase() || '',
                            '', '', '', '', '',
                        ]);
                    }
                }
            }
        }

        // ═══════ FALLBACK ═══════
        else {
            csv += row(['', '', '', '', '', '', '', 'UNSUPPORTED STAGE TYPE', '', '', '', '', '', '', '']);
        }

        return new NextResponse(csv, {
            status: 200,
            headers: csvHeaders('standings'),
        });
    } catch (error) {
        console.error('Error generating standings CSV:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

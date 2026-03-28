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
            csv += row([esportName, 'STANDINGS']);
            csv += row([`${categoryLabel} — ${gs.stage_name?.replace(/_/g, ' ').toUpperCase() || 'GROUP STAGE'}`]);
            csv += emptyRow();

            for (const group of gs.groups) {
                // Group header
                csv += row([group.group_name?.toUpperCase() || 'GROUP']);

                // Unified Headers
                // MLBB Tiebreaker = Avg Win Time, Valorant Tiebreaker = Round Diff
                csv += row(['LOGO LINK', 'RANK', 'ABBREV', 'TEAM NAME', 'W', 'D', 'L', 'W-D-L', 'PTS', 'TIEBREAKER']);

                // Team rows (capped)
                const teams = group.teams.slice(0, MAX_TEAMS);
                for (let i = 0; i < MAX_TEAMS; i++) {
                    const t = teams[i] as TeamStanding | undefined;
                    if (!t) {
                        csv += row([N, i + 1, N, N, N, N, N, N, N, N]);
                        continue;
                    }

                    const tiebreaker = isValorant 
                       ? (t.round_difference !== undefined ? (t.round_difference >= 0 ? `+${t.round_difference}` : String(t.round_difference)) : '-')
                       : (t.avg_win_duration || '-');

                    const wdl = `${t.wins}-${t.draws}-${t.losses}`;

                    csv += row([
                        t.school_logo_url || N,
                        t.position,
                        t.school_abbreviation || N,
                        t.school_name || N,
                        t.wins,
                        t.draws,
                        t.losses,
                        wdl,
                        t.points,
                        tiebreaker
                    ]);
                }

                csv += emptyRow();
            }
        }

        // ═══════ ELIMINATION BRACKETS (2D SPATIAL GFX RENDERER) ═══════
        else if (standings.competition_stage === 'playoffs' || standings.competition_stage === 'elimination') {
            const bs = standings as BracketStandings;

            // Generate a 150x50 generic matrix to hold the spatial bracket timeline
            const GRID_ROWS = 150;
            const GRID_COLS = 50;
            const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(''));
            
            // Standard placement offsets to guarantee VMIX safety without overwriting
            grid[0][0] = esportName;
            grid[1][0] = `${categoryLabel} — ${bs.stage_name?.replace(/_/g, ' ').toUpperCase() || 'PLAYOFFS'} TIMELINE`;

            // Group bracket matches by group_name
            const groupsMap = new Map<string, BracketMatch[]>();
            for (const m of bs.bracket) {
                const groupKey = (m.group_name || `Round ${m.round}`).toUpperCase();
                if (!groupsMap.has(groupKey)) groupsMap.set(groupKey, []);
                groupsMap.get(groupKey)!.push(m);
            }

            let groupRowOffset = 3;

            for (const [groupName, matches] of groupsMap.entries()) {
                grid[groupRowOffset][0] = groupName;
                
                // Sort matches first by round, then by position
                const sorted = [...matches].sort((a, b) => {
                    if (a.round === b.round) return a.position - b.position;
                    return a.round - b.round;
                });

                // Group by round to determine dynamic spatial positioning
                const minRound = Math.min(...sorted.map(m => m.round));
                const rounds = new Map<number, BracketMatch[]>();
                for (const m of sorted) {
                    if (!rounds.has(m.round)) rounds.set(m.round, []);
                    rounds.get(m.round)!.push(m);
                }

                let maxRowUsedInGroup = groupRowOffset + 2;

                for (const [roundNum, roundMatches] of rounds.entries()) {
                    const roundIndex = roundNum - minRound;
                    const colOffset = roundIndex * 8; 
                    
                    // Print Round Headers mapping
                    grid[groupRowOffset + 1][colOffset] = `ROUND ${roundNum}`;
                    grid[groupRowOffset + 2][colOffset] = 'MATCH';
                    grid[groupRowOffset + 2][colOffset + 1] = 'T1/T2';
                    grid[groupRowOffset + 2][colOffset + 2] = 'LOGO';
                    grid[groupRowOffset + 2][colOffset + 3] = 'SCHOOL';
                    grid[groupRowOffset + 2][colOffset + 4] = 'ABBR';
                    grid[groupRowOffset + 2][colOffset + 5] = 'SCORE';
                    grid[groupRowOffset + 2][colOffset + 6] = 'STATUS';

                    // Spatial Binary Tree Spacing Rules
                    // Math.pow ensures subsequent rounds physically gap outwards perfectly aligned mid-match
                    const rowSpacing = Math.pow(2, roundIndex) * 4;
                    const baseRow = Math.pow(2, roundIndex) * 2 - 2;

                    for (let i = 0; i < roundMatches.length; i++) {
                        const m = roundMatches[i];
                        const matchRow = groupRowOffset + 4 + baseRow + (i * rowSpacing);

                        if (matchRow + 2 >= GRID_ROWS) break; // Overflow protection
                        maxRowUsedInGroup = Math.max(maxRowUsedInGroup, matchRow + 3);

                        const matchLabel = m.match_name || `Match ${m.position}`;
                        const status = m.match_status?.toUpperCase() || 'UPCOMING';
                        
                        // Team 1 Row
                        grid[matchRow][colOffset] = matchLabel;
                        grid[matchRow][colOffset + 1] = 'Team 1';
                        grid[matchRow][colOffset + 2] = m.team1?.school_logo_url || N;
                        grid[matchRow][colOffset + 3] = m.team1?.school_name || 'TBD';
                        grid[matchRow][colOffset + 4] = m.team1?.school_abbreviation || 'TBD';
                        grid[matchRow][colOffset + 5] = String(m.team1?.score ?? '-');
                        grid[matchRow][colOffset + 6] = status;

                        // Team 2 Row
                        grid[matchRow + 1][colOffset] = '';
                        grid[matchRow + 1][colOffset + 1] = 'Team 2';
                        grid[matchRow + 1][colOffset + 2] = m.team2?.school_logo_url || N;
                        grid[matchRow + 1][colOffset + 3] = m.team2?.school_name || 'TBD';
                        grid[matchRow + 1][colOffset + 4] = m.team2?.school_abbreviation || 'TBD';
                        grid[matchRow + 1][colOffset + 5] = String(m.team2?.score ?? '-');
                        
                        // Winner Row Breakout
                        grid[matchRow + 2][colOffset + 3] = 'WINNER:';
                        grid[matchRow + 2][colOffset + 4] = m.winner?.school_abbreviation || '-';
                    }
                }

                // Add adequate spacing before the next group
                groupRowOffset = maxRowUsedInGroup + 4;
            }

            // Convert populated 2D Grid to flattened CSV blocks
            let maxCol = 10;
            for(let r = 0; r < GRID_ROWS; r++) {
               for(let c = 0; c < GRID_COLS; c++) {
                   if(grid[r][c] && c > maxCol) maxCol = c;
               }
            }
            
            // Output populated rows
            for (let r = 0; r <= groupRowOffset; r++) {
                const rowSlice = grid[r].slice(0, maxCol + 1);
                csv += row(rowSlice);
            }
        }

        // ═══════ FALLBACK ═══════
        else {
            csv += row(['UNSUPPORTED STAGE TYPE']);
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

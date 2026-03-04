import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { row, emptyRow, csvHeaders } from '@/lib/utils/csv-helpers';

const N = 'None';

/**
 * Export: Match Overview CSV — 15 columns (A–O)
 * Team info, scores, game details
 */
export async function GET(
    request: NextRequest,
) {
    try {
        const { searchParams } = new URL(request.url);
        const matchIdStr = searchParams.get('matchId');

        if (!matchIdStr) {
            return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
        }

        const matchId = parseInt(matchIdStr, 10);
        if (isNaN(matchId)) return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });

        const supabase = await getSupabaseServer();

        const { data: match, error } = await supabase
            .from('matches')
            .select(`
                id, name, status, best_of, scheduled_at, venue, group_name, round,
                match_participants(id, team_id, match_score, schools_teams(id, name, schools(abbreviation, name, logo_url))),
                esports_seasons_stages(competition_stage, esports_categories(division, levels, esports(name))),
                games(id, game_number, status, valorant_map_id, valorant_maps(name))
            `)
            .eq('id', matchId)
            .single();

        if (error || !match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

        const parts = (match as any).match_participants || [];
        const getSchool = (p: any) => {
            const school = Array.isArray(p?.schools_teams?.schools) ? p.schools_teams.schools[0] : p?.schools_teams?.schools;
            return { abbr: school?.abbreviation || N, name: school?.name || N };
        };

        const t1 = parts[0];
        const t2 = parts[1];
        const s1 = getSchool(t1);
        const s2 = getSchool(t2);

        const esportName = (match as any).esports_seasons_stages?.esports_categories?.esports?.name || N;
        const stage = (match as any).esports_seasons_stages?.competition_stage?.replace(/_/g, ' ').toUpperCase() || N;
        const division = (match as any).esports_seasons_stages?.esports_categories?.division || '';
        const levels = (match as any).esports_seasons_stages?.esports_categories?.levels || '';

        let csv = '';

        // Row 1: TEAM A ... TITLE ... TEAM B
        csv += row([s1.abbr, '', '', '', '', '', '', 'MATCH OVERVIEW', '', '', '', '', '', '', s2.abbr]);

        // Row 2: School names
        csv += row([s1.name, '', '', '', '', '', '', esportName, '', '', '', '', '', '', s2.name]);

        // Row 3: Match score
        csv += row([t1?.match_score ?? 0, '', '', '', '', '', 'MATCH SCORE', `BO${match.best_of}`, 'MATCH SCORE', '', '', '', '', '', t2?.match_score ?? 0]);

        // Row 4: Competition details
        csv += row(['', '', '', '', '', '', '', `${stage} ${division} ${levels}`.trim(), '', '', '', '', '', '', '']);

        // Row 5: Status + venue
        csv += row(['', '', '', '', '', '', 'STATUS', (match.status || 'upcoming').toUpperCase(), 'VENUE', '', '', '', '', '', '']);
        csv += row(['', '', '', '', '', '', match.status || N, '', match.venue || N, '', '', '', '', '', '']);

        csv += emptyRow();

        // Row 8: Games header
        csv += row(['', '', '', '', '', '', '', 'GAMES', '', '', '', '', '', '', '']);
        csv += row(['GAME', 'STATUS', 'MAP', '', '', '', '', '', '', '', '', '', '', '', '']);

        // Game rows (max 7)
        const games = ((match as any).games || []).sort((a: any, b: any) => a.game_number - b.game_number);
        const maxGames = 7;
        for (let i = 0; i < maxGames; i++) {
            const g = games[i];
            if (!g) {
                csv += row([`Game ${i + 1}`, N, N, '', '', '', '', '', '', '', '', '', '', '', '']);
            } else {
                const mapName = (g as any).valorant_maps?.name || N;
                csv += row([
                    `Game ${g.game_number}`,
                    (g.status || 'pending').replace(/_/g, ' '),
                    mapName,
                    '', '', '', '', '', '', '', '', '', '', '', '',
                ]);
            }
        }

        return new NextResponse(csv, {
            status: 200,
            headers: csvHeaders(`match-overview-${matchId}`),
        });
    } catch (error) {
        console.error('Error generating match overview CSV:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { GameDraftService } from '@/services/game-draft';
import { GameRosterService } from '@/services/game-roster';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Public API endpoint for fetching game draft state.
 * Used by external overlays (like OBS) to display live drafts.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId: gameIdStr } = await params;
        const gameId = parseInt(gameIdStr, 10);

        if (isNaN(gameId)) {
            return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
        }

        // We use getSupabaseServer just for the raw game fetch to get team context
        const supabase = await getSupabaseServer();
        const { data: game, error: gameError } = await supabase
            .from('games')
            .select(`
                *,
                match:matches(
                    match_participants(
                        team_id,
                        team:schools_teams(
                            id, 
                            name, 
                            school:schools(abbreviation, logo_url)
                        )
                    )
                )
            `)
            .eq('id', gameId)
            .single();

        if (gameError || !game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Fetch draft actions and rosters in parallel
        const [draftRes, rosterRes] = await Promise.all([
            GameDraftService.getByGameId(gameId),
            GameRosterService.getByGameId(gameId)
        ]);

        if (!draftRes.success || !rosterRes.success) {
            return NextResponse.json({ error: 'Failed to fetch draft data' }, { status: 500 });
        }

        const matchTeams = game.match?.match_participants || [];
        const teams = matchTeams.map((p: any) => {
            if (!p.team) return null;

            // Handle both array and single object returns for school relation
            const schoolData = Array.isArray(p.team.school) ? p.team.school[0] : p.team.school;

            return {
                id: p.team.id,
                name: p.team.name,
                abbreviation: schoolData?.abbreviation || null,
                logo_url: schoolData?.logo_url || null
            };
        }).filter(Boolean);

        return NextResponse.json({
            game: {
                id: game.id,
                game_number: game.game_number,
                map_name: (game as any).map_name
            },
            teams,
            draft_actions: draftRes.data,
            rosters: rosterRes.data
        }, {
            headers: {
                // Enable CORS for external overlays
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (error) {
        console.error('Error fetching game draft:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

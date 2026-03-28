import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { filters } = body;

        if (!filters) {
            return NextResponse.json({ success: false, error: 'Missing filters object' }, { status: 400 });
        }

        const supabase = await getSupabaseServer();
        
        // Build base query params block from global filters
        const baseParams: any = { game: filters.game };
        if (filters.seasonId) baseParams.seasonId = parseInt(filters.seasonId);
        if (filters.categoryId) baseParams.categoryId = parseInt(filters.categoryId);
        if (filters.stageId) baseParams.stageId = parseInt(filters.stageId);

        // Update titles that just use base filters
        const baseTitles = ['standings', 'team-stats', 'character-stats', 'map-stats', 'match-overview', 'player-stats'];
        await supabase.from('active_api_exports').update({ query_params: baseParams }).in('title', baseTitles);

        // Update titles that use specific metric/limit
        const leaderboardParams = { ...baseParams, metric: filters.metric, limit: parseInt(filters.leaderboardLimit) };
        await supabase.from('active_api_exports').update({ query_params: leaderboardParams }).eq('title', 'player-leaderboard');

        // Update H2H Teams
        const h2hTeamsParams = { ...baseParams, mode: filters.h2hMode };
        if (filters.teamA) h2hTeamsParams.team1Id = parseInt(filters.teamA);
        if (filters.teamB) h2hTeamsParams.team2Id = parseInt(filters.teamB);
        await supabase.from('active_api_exports').update({ query_params: h2hTeamsParams }).eq('title', 'h2h-teams');

        // Update H2H Players
        const h2hPlayersParams = { ...baseParams, mode: filters.h2hMode };
        if (filters.playerA) h2hPlayersParams.player1Id = parseInt(filters.playerA);
        if (filters.playerB) h2hPlayersParams.player2Id = parseInt(filters.playerB);
        await supabase.from('active_api_exports').update({ query_params: h2hPlayersParams }).eq('title', 'h2h-players');

        // Match specifics
        if (filters.matchId) {
            const matchParams = { ...baseParams, matchId: parseInt(filters.matchId) };
            await supabase.from('active_api_exports').update({ query_params: matchParams }).in('title', ['draft', 'game-results', 'valorant-map-veto']);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error syncing active exports:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

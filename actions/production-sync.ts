'use server';

import { ActiveApiExportService } from '@/services/active-api-exports';

/**
 * Syncs the global production filter state to the database for all 
 * production API exports.
 */
export async function syncProductionState(filters: any) {
    // These titles match the 'title' column in the active_api_exports table
    const EXPORT_TITLES = [
        'standings',
        'player-leaderboard',
        'player-stats',
        'team-stats',
        'character-stats',
        'match-overview',
        'h2h-players',
        'h2h-teams',
        'map-stats'
    ];

    const results = await Promise.all(EXPORT_TITLES.map(async (title) => {
        const queryParams: any = {
            game: filters.game,
            seasonId: filters.seasonId,
            stageId: filters.stageId,
            categoryId: filters.categoryId,
            metric: filters.metric,
            leaderboardLimit: filters.leaderboardLimit,
        };

        // Special handling for H2H
        if (title.startsWith('h2h')) {
            queryParams.playerA = filters.playerA;
            queryParams.playerB = filters.playerB;
            queryParams.teamA = filters.teamA;
            queryParams.teamB = filters.teamB;
            queryParams.mode = filters.h2hMode;
        }

        // Special handling for Match Overview
        if (title === 'match-overview') {
            queryParams.matchId = filters.matchId;
        }

        // Update the row in DB
        return ActiveApiExportService.updateByTitle(title, {
            game_id: null, // We could map game name to ID if needed, but currently routes use 'game' string
            match_id: filters.matchId ? parseInt(filters.matchId) : null,
            query_params: queryParams
        });
    }));

    return {
        success: results.every(r => r.success),
        errors: results.filter(r => !r.success).map(r => r.error)
    };
}

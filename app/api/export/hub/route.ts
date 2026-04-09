import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Unified export hub API
 * Fetches the active export configuration and proxies to the appropriate export API
 * with query parameters merged from the database and URL
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const title = searchParams.get('title');

        if (!title) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameter: title' },
                { status: 400 }
            );
        }

        // Get the active export configuration
        const supabase = await getSupabaseServer();
        const { data: exportConfig, error } = await supabase
            .from('active_api_exports')
            .select('*')
            .eq('title', title)
            .single();

        if (error || !exportConfig) {
            return NextResponse.json(
                { success: false, error: `No active export configuration found for: ${title}` },
                { status: 404 }
            );
        }

        // Get base URL from database or use default mapping
        let apiPath = exportConfig.base_url;
        
        if (!apiPath) {
            const apiPathMap: Record<string, string> = {
                'player-stats': '/api/export/players/stats',
                'player-leaderboard': '/api/export/players/leaderboard',
                'character-stats': '/api/export/characters/stats',
                'team-stats': '/api/export/teams/stats',
                'h2h-teams': '/api/export/head-to-head/teams',
                'h2h-players': '/api/export/head-to-head/players',
                'map-stats': '/api/export/maps/stats',
                'match-overview': '/api/export/matches',
                'standings': '/api/export/standings',
                'draft': '/api/games/draft',
                'game-results': '/api/games/game-results',
            };
            
            apiPath = apiPathMap[title];
            if (!apiPath) {
                return NextResponse.json(
                    { success: false, error: `Unknown export type: ${title}` },
                    { status: 400 }
                );
            }
        }

        // Build query parameters with priority: URL params > database query_params > database game_id/match_id
        const queryParams = new URLSearchParams();
        const dbParams = (exportConfig.query_params as Record<string, any>) || {};
        Object.entries(dbParams).forEach(([k, v]) => { if (v !== null) queryParams.set(k, String(v)); });

        if (exportConfig.game_id) queryParams.set('gameId', String(exportConfig.game_id));
        if (exportConfig.match_id) queryParams.set('matchId', String(exportConfig.match_id));

        searchParams.forEach((v, k) => { if (k !== 'title') queryParams.set(k, v); });

        // Handle path placeholders
        let finalPath = apiPath;
        if (apiPath.includes('[gameId]') && queryParams.has('gameId')) {
            finalPath = apiPath.replace('[gameId]', queryParams.get('gameId')!);
            queryParams.delete('gameId');
        }
        if (apiPath.includes('[matchId]') && queryParams.has('matchId')) {
            finalPath = apiPath.replace('[matchId]', queryParams.get('matchId')!);
            queryParams.delete('matchId');
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const queryString = queryParams.toString();
        const fullUrl = queryString ? `${baseUrl}${finalPath}?${queryString}` : `${baseUrl}${finalPath}`;

        const response = await fetch(fullUrl);
        const contentType = response.headers.get('content-type') || 'application/json';
        const data = await (contentType.includes('json') ? response.json() : response.text());

        return new NextResponse(
            typeof data === 'string' ? data : JSON.stringify(data),
            {
                status: response.status,
                headers: { 'Content-Type': contentType },
            }
        );
    } catch (error: any) {
        console.error('Error in unified export hub:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

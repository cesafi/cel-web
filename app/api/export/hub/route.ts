import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Unified export hub API
 * Fetches the active export configuration and proxies to the appropriate export API
 * with query parameters merged from the database and URL
 * 
 * Usage: /api/export/hub?title=character-stats&seasonId=5&game=valorant
 * 
 * The 'title' param identifies which export to use
 * All other params are passed through to the export API
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
            // Fallback to default mapping if base_url is not set
            const apiPathMap: Record<string, string> = {
                'draft': '/api/games/draft',
                'game-results': '/api/games/game-results',
                'character-stats': '/api/export/characters/stats',
                'player-leaderboard': '/api/export/players/leaderboard',
                'player-stats': '/api/export/players/stats',
                'team-stats': '/api/export/teams/stats',
                'map-stats': '/api/export/maps/stats',
                'h2h-players': '/api/export/head-to-head/players',
                'h2h-teams': '/api/export/head-to-head/teams',
                'standings': '/api/export/standings',
                'standings-data': '/api/export/standings-data',
                'match-overview': '/api/export/matches',
                'valorant-map-veto': '/api/export/valorant-map-veto',
                'filters': '/api/export/filters',
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
        
        // 1. Start with database stored query_params (lowest priority)
        if (exportConfig.query_params && typeof exportConfig.query_params === 'object') {
            Object.entries(exportConfig.query_params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    queryParams.set(key, String(value));
                }
            });
        }

        // 2. Add game_id or match_id if present in the database (medium priority)
        if (exportConfig.game_id) {
            queryParams.set('gameId', String(exportConfig.game_id));
        }
        if (exportConfig.match_id) {
            queryParams.set('matchId', String(exportConfig.match_id));
        }

        // 3. Add all URL parameters (except 'title') - highest priority, these override everything
        searchParams.forEach((value, key) => {
            if (key !== 'title') {
                queryParams.set(key, value);
            }
        });

        // Handle dynamic routes (e.g., /api/games/draft/[gameId])
        let fullPath = apiPath;
        if (apiPath.includes('[gameId]') && queryParams.has('gameId')) {
            fullPath = apiPath.replace('[gameId]', queryParams.get('gameId')!);
            queryParams.delete('gameId'); // Remove from query params since it's in the path
        }
        if (apiPath.includes('[matchId]') && queryParams.has('matchId')) {
            fullPath = apiPath.replace('[matchId]', queryParams.get('matchId')!);
            queryParams.delete('matchId'); // Remove from query params since it's in the path
        }

        // Build the full URL
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const queryString = queryParams.toString();
        const fullUrl = queryString ? `${baseUrl}${fullPath}?${queryString}` : `${baseUrl}${fullPath}`;

        // Fetch from the production API
        const response = await fetch(fullUrl, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { success: false, error: `Export API error: ${errorText}` },
                { status: response.status }
            );
        }

        // Return the response with the same content type
        const contentType = response.headers.get('content-type') || 'application/json';
        const data = contentType.includes('application/json') 
            ? await response.json() 
            : await response.text();

        return new NextResponse(
            typeof data === 'string' ? data : JSON.stringify(data),
            {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
                },
            }
        );

    } catch (error: any) {
        console.error('Error in unified export hub:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

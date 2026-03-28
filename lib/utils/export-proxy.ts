import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

const cache = new Map<string, { expiresAt: number; data: any; contentType: string }>();
const CACHE_TTL = 10000; // 10 seconds cache to protect Supabase Egress

/**
 * Shared proxy logic for native API exports.
 * Reads the active config from `active_api_exports`,
 * constructs a modified NextRequest, and directly calls the underlying handler.
 */
export async function proxyExport(
    request: NextRequest, 
    title: string, 
    handler: (req: NextRequest, props?: any) => Promise<Response | NextResponse>
) {
    try {
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

        // Build query parameters
        const newUrl = new URL(request.url);

        if (exportConfig.query_params && typeof exportConfig.query_params === 'object') {
            Object.entries(exportConfig.query_params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    newUrl.searchParams.set(key, String(value));
                }
            });
        }

        const dbParams: Record<string, string> = {};
        if (exportConfig.game_id) {
            newUrl.searchParams.set('gameId', String(exportConfig.game_id));
            dbParams.gameId = String(exportConfig.game_id);
        }
        if (exportConfig.match_id) {
            newUrl.searchParams.set('matchId', String(exportConfig.match_id));
            dbParams.matchId = String(exportConfig.match_id);
        }

        const { searchParams } = new URL(request.url);
        searchParams.forEach((value, key) => {
            if (key !== 'title') newUrl.searchParams.set(key, value);
        });

        // Clone the request with the new URL containing all unified search parameters
        const modifiedRequest = new NextRequest(newUrl, request);
        
        // Pass dynamic params if needed for routes like [matchId]
        const props = Object.keys(dbParams).length > 0 ? { params: Promise.resolve(dbParams) } : { params: Promise.resolve({}) };

        // Call the underlying handler directly
        const response = await handler(modifiedRequest, props);
        return response;

    } catch (error: any) {
        console.error(`Error in export proxy [${title}]:`, error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

import { NextRequest } from 'next/server';
import { VmixFormat } from './vmix-format';
import { createClient } from '@supabase/supabase-js';

import { unstable_cache } from 'next/cache';

const getCachedActiveConfig = unstable_cache(
    async (title: string) => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
            return { success: false, error: 'Missing Supabase environment variables' };
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        const { data, error } = await supabase
            .from('active_api_exports')
            .select('*')
            .eq('title', title)
            .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    },
    ['active-api-export-cache'],
    { revalidate: 5 } // Cache for 5 seconds
);

/**
 * Utility to fetch and merge active parameters for a production API.
 * Priority: URL Search Params (if provided) > Dynamic Route Params > Database Active Config
 */
export async function getActiveParams(
    request: NextRequest, 
    title: string, 
    dynamicParams: Record<string, string | string[] | undefined> = {}
) {
    const { searchParams } = new URL(request.url);
    
    // Convert dynamic params to simple record
    const cleanedDynamic = Object.fromEntries(
        Object.entries(dynamicParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
    );

    // Check if URL has any functional params (other than format)
    const hasUrlParams = Array.from(searchParams.keys()).some(k => k !== 'format');
    
    // If we have URL params, they take highest priority
    if (hasUrlParams) {
        return {
            ...cleanedDynamic,
            ...Object.fromEntries(searchParams.entries())
        };
    }

    // Otherwise, fetch from the "Active" database table (cached for 5 seconds)
    const result = await getCachedActiveConfig(title);
    console.log(`[getActiveParams] title: ${title}, result:`, result);
    if (!result.success || !result.data) {
        return {
            ...cleanedDynamic,
            ...Object.fromEntries(searchParams.entries())
        };
    }

    const dbParams = (result.data.query_params as Record<string, any>) || {};
    
    // Map db match_id/game_id if present
    const dbOverrides: Record<string, any> = {};
    if (result.data.match_id) dbOverrides.matchId = String(result.data.match_id);
    if (result.data.game_id) dbOverrides.gameId = String(result.data.game_id);

    // Merge: URL params > DB overrides > DB raw params > Dynamic route params
    const merged = {
        ...cleanedDynamic,
        ...dbParams,
        ...dbOverrides,
        ...Object.fromEntries(searchParams.entries())
    };

    // Robust serialization: Ensure all values are primitives to prevent [object Object] errors in DB queries
    return Object.fromEntries(
        Object.entries(merged).map(([k, v]) => {
            if (v === null || v === undefined) return [k, undefined];
            if (typeof v === 'object') return [k, JSON.stringify(v)];
            return [k, String(v)];
        })
    );
}

/**
 * Returns 'csv' if no format is specified, ensuring production links stay stable.
 */
export function getProductionFormat(request: NextRequest): VmixFormat {
    const { searchParams } = new URL(request.url);
    const f = searchParams.get('format');
    if (f === 'json' || f === 'json-flat' || f === 'xml' || f === 'csv') {
        return f as VmixFormat;
    }
    return 'csv';
}

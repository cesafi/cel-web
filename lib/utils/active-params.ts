import { NextRequest } from 'next/server';
import { ActiveApiExportService } from '@/services/active-api-exports';
import { VmixFormat } from './vmix-format';

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

    // Otherwise, fetch from the "Active" database table
    const result = await ActiveApiExportService.getByTitle(title);
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

import { NextRequest } from 'next/server';
import { ActiveApiExportService } from '@/services/active-api-exports';
import { VmixFormat } from './vmix-format';

/**
 * Utility to fetch and merge active parameters for a production API.
 * Priority: URL Search Params (if provided) > Database Active Config
 */
export async function getActiveParams(request: NextRequest, title: string) {
    const { searchParams } = new URL(request.url);
    
    // Check if URL has any functional params (other than format)
    const hasUrlParams = Array.from(searchParams.keys()).some(k => k !== 'format');
    
    // If we have URL params, we can still use them (useful for deep-linking or custom Casters)
    if (hasUrlParams) {
        return Object.fromEntries(searchParams.entries());
    }

    // Otherwise, fetch from the "Active" database table
    const result = await ActiveApiExportService.getByTitle(title);
    if (!result.success || !result.data) {
        return Object.fromEntries(searchParams.entries());
    }

    const dbParams = (result.data.query_params as Record<string, any>) || {};
    
    // Merge URL "id" or "format" with DB params
    return {
        ...dbParams,
        ...Object.fromEntries(searchParams.entries())
    };
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

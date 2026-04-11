import { NextResponse, NextRequest } from 'next/server';
import { getActiveParams } from '@/lib/utils/active-params';
import { GET as draftHandler } from '@/app/api/games/draft/[gameId]/route';
import { getExportCacheVersion } from '@/lib/utils/export-cache';

// Simple in-memory cache to shield the DB from aggressive polling (e.g. 1ms vMix updates).
// This avoids Next.js `unstable_cache` conflicts with `cookies()` used in the handler.
let memoryCache: {
    gameId: string;
    text: string;
    status: number;
    headers: Record<string, string>;
    version: number;
} | null = null;

/**
 * Production API: Draft
 */
export async function GET(request: NextRequest) {
    const params = await getActiveParams(request, 'draft');
    const gameId = params.gameId ? String(params.gameId) : undefined;

    if (!gameId) {
        return NextResponse.json({ success: false, error: 'gameId is required' }, { status: 400 });
    }

    // Serve from cache if valid and gameId matches the exact state version
    if (memoryCache && memoryCache.gameId === gameId && memoryCache.version === getExportCacheVersion('draft')) {
        return new NextResponse(memoryCache.text, {
            status: memoryCache.status,
            headers: memoryCache.headers
        });
    }

    try {
        const mockReq = new NextRequest(new URL(`/api/games/draft/${gameId}`, request.url));
        const res = await draftHandler(mockReq, { params: Promise.resolve({ gameId }) });
        
        if (!res.ok) throw new Error(`Draft generation failed with status ${res.status}`);
        
        const text = await res.text();
        const headers = Object.fromEntries(res.headers.entries());

        // Update in-memory cache
        memoryCache = {
            gameId,
            text,
            status: res.status,
            headers,
            version: getExportCacheVersion('draft')
        };

        return new NextResponse(text, { status: res.status, headers });
    } catch (error) {
        console.error('Draft generation failed:', error);
        // Fallback to direct handler on unexpected proxy execution failures
        return draftHandler(request, { params: Promise.resolve({ gameId }) });
    }
}

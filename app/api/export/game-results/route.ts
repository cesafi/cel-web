import { NextResponse, NextRequest } from 'next/server';
import { getActiveParams } from '@/lib/utils/active-params';
import { GET as gameResultsHandler } from '@/app/api/games/game-results/[gameId]/route';
import { getExportCacheVersion } from '@/lib/utils/export-cache';

// Event-driven in-memory cache — only refreshes when a write action bumps the version.
let memoryCache: {
    gameId: string;
    text: string;
    status: number;
    headers: Record<string, string>;
    version: number;
} | null = null;

/**
 * Production API: Game Results
 * Serves cached CSV until a game-results write action bumps the version.
 */
export async function GET(request: NextRequest) {
    const params = await getActiveParams(request, 'game-results');
    const gameId = params.gameId ? String(params.gameId) : undefined;

    if (!gameId) {
        return NextResponse.json({ success: false, error: 'gameId is required' }, { status: 400 });
    }

    // Serve from cache if version matches
    if (memoryCache && memoryCache.gameId === gameId && memoryCache.version === getExportCacheVersion('game-results')) {
        return new NextResponse(memoryCache.text, {
            status: memoryCache.status,
            headers: memoryCache.headers
        });
    }

    try {
        const mockReq = new NextRequest(new URL(`/api/games/game-results/${gameId}`, request.url));
        const res = await gameResultsHandler(mockReq, { params: Promise.resolve({ gameId }) });

        if (!res.ok) throw new Error(`Game results generation failed with status ${res.status}`);

        const text = await res.text();
        const headers = Object.fromEntries(res.headers.entries());

        memoryCache = {
            gameId,
            text,
            status: res.status,
            headers,
            version: getExportCacheVersion('game-results')
        };

        return new NextResponse(text, { status: res.status, headers });
    } catch (error) {
        console.error('Game results generation failed:', error);
        return gameResultsHandler(request, { params: Promise.resolve({ gameId }) });
    }
}

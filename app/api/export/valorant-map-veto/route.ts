import { NextResponse, NextRequest } from 'next/server';
import { getActiveParams } from '@/lib/utils/active-params';
import { GET as mapVetoHandler } from '@/app/api/matches/valorant-map-veto/[matchId]/route';
import { getExportCacheVersion } from '@/lib/utils/export-cache';

// Event-driven in-memory cache — only refreshes when a write action bumps the version.
let memoryCache: {
    matchId: string;
    text: string;
    status: number;
    headers: Record<string, string>;
    version: number;
} | null = null;

/**
 * Production API: Valorant Map Veto
 * Serves cached response until a map-veto write action bumps the version.
 */
export async function GET(request: NextRequest) {
    const params = await getActiveParams(request, 'valorant-map-veto');
    const matchId = params.matchId ? String(params.matchId) : undefined;

    if (!matchId) {
        return NextResponse.json({ success: false, error: 'matchId is required' }, { status: 400 });
    }

    // Serve from cache if version matches
    if (memoryCache && memoryCache.matchId === matchId && memoryCache.version === getExportCacheVersion('map-veto')) {
        return new NextResponse(memoryCache.text, {
            status: memoryCache.status,
            headers: memoryCache.headers
        });
    }

    try {
        const mockReq = new NextRequest(new URL(`/api/matches/valorant-map-veto/${matchId}`, request.url));
        const res = await mapVetoHandler(mockReq, { params: Promise.resolve({ matchId }) });

        if (!res.ok) throw new Error(`Map veto generation failed with status ${res.status}`);

        const text = await res.text();
        const headers = Object.fromEntries(res.headers.entries());

        memoryCache = {
            matchId,
            text,
            status: res.status,
            headers,
            version: getExportCacheVersion('map-veto')
        };

        return new NextResponse(text, { status: res.status, headers });
    } catch (error) {
        console.error('Map veto generation failed:', error);
        return mapVetoHandler(request, { params: Promise.resolve({ matchId }) });
    }
}

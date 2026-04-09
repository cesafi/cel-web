import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy to unified games draft API
 * Provided for backward compatibility and build system satisfaction
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
    
    // If we have a gameId, proxy to the dynamic route, otherwise the general one
    const targetPath = gameId ? `/api/games/draft/${gameId}` : '/api/games/draft';
    const targetUrl = new URL(targetPath, baseUrl);
    
    // Forward params
    searchParams.forEach((v, k) => { if (k !== 'gameId') targetUrl.searchParams.set(k, v); });

    try {
        const response = await fetch(targetUrl.toString());
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Proxy error' }, { status: 500 });
    }
}

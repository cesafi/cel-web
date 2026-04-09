import { NextRequest } from 'next/server';
import { getActiveParams } from '@/lib/utils/active-params';

// Re-export the handler from the canonical route, resolving active params first
import { GET as gameResultsHandler } from '@/app/api/games/game-results/[gameId]/route';

/**
 * Production API: Game Results
 * Resolves active gameId from DB config, then delegates directly to the handler.
 * No internal fetch — eliminates double-request overhead.
 */
export async function GET(request: NextRequest) {
    const params = await getActiveParams(request, 'game-results');
    const gameId = params.gameId;

    if (!gameId) {
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ success: false, error: 'gameId is required' }, { status: 400 });
    }

    // Call the handler directly with the resolved gameId
    return gameResultsHandler(request, { params: Promise.resolve({ gameId: String(gameId) }) });
}

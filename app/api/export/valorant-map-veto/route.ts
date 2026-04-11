import { NextRequest } from 'next/server';
import { getActiveParams } from '@/lib/utils/active-params';

// Re-export the handler from the canonical route, resolving active params first
import { GET as mapVetoHandler } from '@/app/api/matches/valorant-map-veto/[matchId]/route';

/**
 * Production API: Valorant Map Veto
 * Resolves active matchId from DB config, then delegates directly to the handler.
 * No internal fetch — eliminates double-request overhead.
 */
export async function GET(request: NextRequest) {
    const params = await getActiveParams(request, 'valorant-map-veto');
    const matchId = params.matchId;

    if (!matchId) {
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ success: false, error: 'matchId is required' }, { status: 400 });
    }

    // Call the handler directly with the resolved matchId
    return mapVetoHandler(request, { params: Promise.resolve({ matchId: String(matchId) }) });
}

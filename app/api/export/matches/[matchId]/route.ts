import { NextRequest, NextResponse } from 'next/server';
import { MatchesService } from '@/services/matches';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

/**
 * Production API: Get specific match overview (Dynamic route)
 * Supports /api/export/matches/123
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const resolvedParams = await params;
    const activeParams = await getActiveParams(request, 'match-overview', resolvedParams);
    const matchId = activeParams.matchId ? parseInt(activeParams.matchId as string) : undefined;
    const format = getProductionFormat(request);

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: 'MatchId is required' },
        { status: 400 }
      );
    }

    const result = await MatchesService.getMatchById(matchId);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Match not found' },
        { status: 404 }
      );
    }

    return vmixResponse(
      result.data,
      format,
      'match',
      {},
      60 // Cache match overview for 1 minute
    );
  } catch (error: any) {
    console.error('Error in production match overview API (dynamic):', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

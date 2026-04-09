import { NextRequest, NextResponse } from 'next/server';
import { MatchesService } from '@/services/matches';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

/**
 * Production API: Get active match overview
 * Permanent URL: /api/production/matches
 */
export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'match-overview');
    const matchId = params.matchId ? parseInt(params.matchId as string) : undefined;
    const format = getProductionFormat(request);

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: 'No active match configured' },
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
      120 // Cache match overview for 2 minutes
    );
  } catch (error: any) {
    console.error('Error in production match overview API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

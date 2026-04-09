import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

/**
 * Production API: Get leaderboard (top N players by a specific metric)
 * Params: game (mlbb|valorant), metric (kills, acs, mvp_count, etc.), limit, seasonId
 */
export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'player-leaderboard');
    const game = (params.game || 'mlbb') as 'mlbb' | 'valorant';
    const metric = (params.metric as string) || (game === 'mlbb' ? 'total_kills' : 'avg_acs');
    const limit = params.limit ? parseInt(params.limit as string) : 5;
    const seasonId = params.seasonId ? parseInt(params.seasonId as string) : undefined;
    const format = getProductionFormat(request);

    const result = await StatisticsService.getLeaderboard(game, metric, limit, seasonId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return vmixResponse(
      result.data,
      format,
      'leaderboard',
      {},
      300 // Cache leaderboard for 5 minutes
    );
  } catch (error: any) {
    console.error('Error in production leaderboard API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

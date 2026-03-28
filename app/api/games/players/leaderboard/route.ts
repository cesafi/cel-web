import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse, getFormatParam } from '@/lib/utils/vmix-format';

/**
 * Production API: Get leaderboard (top N players by a specific metric)
 * Params: game (mlbb|valorant), metric (kills, acs, mvp_count, etc.), limit, seasonId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = (searchParams.get('game') || 'mlbb') as 'mlbb' | 'valorant';
    const metric = searchParams.get('metric') || (game === 'mlbb' ? 'total_kills' : 'avg_acs');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 5;
    const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;
    const format = getFormatParam(request);

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
      'leaderboard'
    );
  } catch (error: any) {
    console.error('Error in production leaderboard API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

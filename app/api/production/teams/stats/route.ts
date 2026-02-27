import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { formatResponse, getFormatParam } from '@/lib/utils/vmix-format';

/**
 * Production API: Get team statistics
 * Params: game (mlbb|valorant), seasonId, stageId, categoryId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = (searchParams.get('game') || 'mlbb') as 'mlbb' | 'valorant';
    const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;
    const stageId = searchParams.get('stageId') ? parseInt(searchParams.get('stageId')!) : undefined;
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
    const format = getFormatParam(request);

    const result = await StatisticsService.getTeamStats(game, seasonId, stageId, categoryId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return formatResponse(
      { success: true, data: result.data },
      format,
      'team_stats'
    );
  } catch (error: any) {
    console.error('Error in production team stats API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

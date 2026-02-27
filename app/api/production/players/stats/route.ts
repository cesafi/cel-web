import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { formatResponse, getFormatParam } from '@/lib/utils/vmix-format';

/**
 * Production API: Get aggregated player statistics
 * Params: game (mlbb|valorant), seasonId, stageId, categoryId, teamId, limit, page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game') || 'mlbb';
    const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;
    const stageId = searchParams.get('stageId') ? parseInt(searchParams.get('stageId')!) : undefined;
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
    const teamId = searchParams.get('teamId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const format = getFormatParam(request);

    const filters = {
      game: game as 'mlbb' | 'valorant',
      season_id: seasonId,
      stage_id: stageId,
      category_id: categoryId,
      team_id: teamId,
      limit,
      page,
    };

    const result = game === 'mlbb'
      ? await StatisticsService.getMlbbPlayerStats(filters)
      : await StatisticsService.getValorantPlayerStats(filters);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return formatResponse(
      { success: true, data: result.data, count: (result as any).count },
      format,
      'player_stats'
    );
  } catch (error: any) {
    console.error('Error in production player stats API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

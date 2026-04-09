import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'player-stats');
    const game = (params.game || 'mlbb') as 'mlbb' | 'valorant';
    const seasonId = params.seasonId ? parseInt(params.seasonId as string) : undefined;
    const stageId = params.stageId ? parseInt(params.stageId as string) : undefined;
    const categoryId = params.categoryId ? parseInt(params.categoryId as string) : undefined;
    const teamId = (params.teamId as string) || undefined;
    const format = getProductionFormat(request);

    const filters = {
      game,
      season_id: seasonId,
      stage_id: stageId,
      category_id: categoryId,
      team_id: teamId,
    };

    const result = game === 'mlbb'
      ? await StatisticsService.getMlbbPlayerStats(filters)
      : await StatisticsService.getValorantPlayerStats(filters);

    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });

    return vmixResponse(result.data, format, 'player_stats', {}, 300);
  } catch (error: any) {
    console.error('Error in player stats API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'team-stats');
    const game = (params.game || 'mlbb') as 'mlbb' | 'valorant';
    const seasonId = params.seasonId ? parseInt(params.seasonId as string) : undefined;
    const format = getProductionFormat(request);

    const result = await StatisticsService.getTeamStats(game, seasonId);

    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });

    return vmixResponse(result.data, format, 'team_stats', {}, 300);
  } catch (error: any) {
    console.error('Error in team stats API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

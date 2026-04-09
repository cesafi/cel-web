import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'character-stats');
    const game = (params.game || 'mlbb') as 'mlbb' | 'valorant';
    const seasonId = params.seasonId ? parseInt(params.seasonId as string) : undefined;
    const format = getProductionFormat(request);

    const result = game === 'mlbb'
      ? await StatisticsService.getHeroStats(seasonId)
      : await StatisticsService.getAgentStats(seasonId);

    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });

    return vmixResponse(result.data, format, 'character_stats', {}, 300);
  } catch (error: any) {
    console.error('Error in character stats API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

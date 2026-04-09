import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

/**
 * Production API: Get hero/agent pick-ban statistics
 * For MLBB: hero pick rates, win rates, avg KDA, avg gold, avg damage
 * For Valorant: agent pick rates, win rates, avg ACS, avg first bloods
 * Params: game (mlbb|valorant), seasonId, stageId, categoryId
 */
export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'character-stats');
    const game = params.game || 'mlbb';
    const seasonId = params.seasonId ? parseInt(params.seasonId as string) : undefined;
    const stageId = params.stageId ? parseInt(params.stageId as string) : undefined;
    const division = (params.division as string) || undefined;
    const format = getProductionFormat(request);

    const result = game === 'mlbb'
      ? await StatisticsService.getHeroStats(seasonId, stageId, division)
      : await StatisticsService.getAgentStats(seasonId, stageId, division);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return vmixResponse(
      result.data,
      format,
      'character_stats'
    );
  } catch (error: any) {
    console.error('Error in production character stats API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

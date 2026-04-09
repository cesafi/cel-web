import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

/**
 * Production API: Get Valorant map pick/ban rate statistics
 * Params: seasonId, stageId
 */
export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'map-stats');
    const seasonId = params.seasonId ? parseInt(params.seasonId as string) : undefined;
    const stageId = params.stageId ? parseInt(params.stageId as string) : undefined;
    const format = getProductionFormat(request);

    const result = await StatisticsService.getMapStats(seasonId, stageId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return vmixResponse(
      result.data,
      format,
      'map_stats'
    );
  } catch (error: any) {
    console.error('Error in production map stats API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

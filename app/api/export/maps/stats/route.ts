import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'map-stats');
    const seasonId = params.seasonId ? parseInt(params.seasonId as string) : undefined;
    const format = getProductionFormat(request);

    // Maps are only relevant for Valorant
    const result = await StatisticsService.getMapStats(seasonId);

    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });

    return vmixResponse(result.data, format, 'map_stats', {}, 300);
  } catch (error: any) {
    console.error('Error in map stats API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

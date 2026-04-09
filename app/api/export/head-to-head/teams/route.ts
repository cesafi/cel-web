import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'h2h-teams');
    const game = (params.game || 'mlbb') as 'mlbb' | 'valorant';
    const teamAId = (params.teamAId as string) || (params.teamA as string);
    const teamBId = (params.teamBId as string) || (params.teamB as string);
    const format = getProductionFormat(request);

    if (!teamAId || !teamBId) {
      return NextResponse.json({ success: false, error: 'Both teamA and teamB are required' }, { status: 400 });
    }

    const result = await StatisticsService.getTeamH2H(game, teamAId, teamBId);

    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });

    return vmixResponse(result.data, format, 'h2h_teams', {}, 300);
  } catch (error: any) {
    console.error('Error in team h2h API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

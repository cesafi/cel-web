import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'h2h-players');
    const game = (params.game || 'mlbb') as 'mlbb' | 'valorant';
    const playerAId = (params.playerAId as string) || (params.playerA as string);
    const playerBId = (params.playerBId as string) || (params.playerB as string);
    const format = getProductionFormat(request);

    if (!playerAId || !playerBId) {
      return NextResponse.json({ success: false, error: 'Both playerA and playerB are required' }, { status: 400 });
    }

    const result = await StatisticsService.getPlayerH2H(game, playerAId, playerBId);

    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });

    return vmixResponse(result.data, format, 'h2h_players', {}, 300);
  } catch (error: any) {
    console.error('Error in player h2h API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

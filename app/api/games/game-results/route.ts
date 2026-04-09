import { NextRequest, NextResponse } from 'next/server';
import { ActiveApiExportService } from '@/services/active-api-exports';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

/**
 * Production API: Active Game Results
 * Permanent URL: /api/games/game-results
 */
export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'game-results');
    const gameId = params.gameId ? parseInt(params.gameId as string) : undefined;
    const format = getProductionFormat(request);

    let targetGameId = gameId;
    if (!targetGameId) {
        const activeData = await ActiveApiExportService.getByTitle('game-results');
        if (activeData.success && activeData.data) {
            targetGameId = activeData.data.game_id || activeData.data.query_params?.matchId;
        }
    }

    if (!targetGameId) {
      return NextResponse.json({ success: false, error: 'No active game result configured' }, { status: 400 });
    }

    return NextResponse.redirect(new URL(`/api/games/game-results/${targetGameId}?format=${format}`, request.url));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

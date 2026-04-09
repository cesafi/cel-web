import { NextRequest, NextResponse } from 'next/server';
import { ActiveApiExportService } from '@/services/active-api-exports';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

/**
 * Production API: Active Draft Data
 * Permanent URL: /api/games/draft
 */
export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'draft');
    const gameId = params.gameId ? parseInt(params.gameId as string) : undefined;
    const format = getProductionFormat(request);

    // If no explicit gameId, check the active_api_exports for game_id or current selection
    let targetGameId = gameId;
    if (!targetGameId) {
        const activeData = await ActiveApiExportService.getByTitle('draft');
        if (activeData.success && activeData.data) {
            targetGameId = activeData.data.game_id || activeData.data.query_params?.matchId;
        }
    }

    if (!targetGameId) {
      return NextResponse.json({ success: false, error: 'No active game/draft configured' }, { status: 400 });
    }

    // Redirect to the actual dynamic route or fetch data directly
    // To keep it simple and permanent, we'll fetch from the existing logic (simplified here)
    // For now, let's redirect to the dynamic one for internal reuse
    return NextResponse.redirect(new URL(`/api/games/draft/${targetGameId}?format=${format}`, request.url));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

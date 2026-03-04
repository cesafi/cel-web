import { NextRequest, NextResponse } from 'next/server';
import { ActiveApiExportService } from '@/services/active-api-exports';
import { GET as handlerGET } from '@/app/api/games/draft/[gameId]/route';

export async function GET(request: NextRequest) {
    try {
        // 1. Get the active draft game_id
        const result = await ActiveApiExportService.getActiveGameId('draft');

        if (!result.success || !result.data) {
            return NextResponse.json(
                { success: false, error: result.success === false ? result.error : 'No active game configured for draft export.' },
                { status: 404 }
            );
        }

        // 2. Mock the params and pass to the original handler
        const params = Promise.resolve({ gameId: String(result.data) });
        return handlerGET(request, { params });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Internal server error while resolving active export' },
            { status: 500 }
        );
    }
}

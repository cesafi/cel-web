import { NextRequest, NextResponse } from 'next/server';
import { ActiveApiExportService } from '@/services/active-api-exports';
import { GET as handlerGET } from '@/app/api/matches/valorant-map-veto/[matchId]/route';

export async function GET(request: NextRequest) {
    try {
        // 1. Get the active valorant-map-veto match_id
        const result = await ActiveApiExportService.getActiveMatchId('valorant-map-veto');

        if (!result.success || !result.data) {
            return NextResponse.json(
                { success: false, error: result.success === false ? result.error : 'No active match configured for map veto export.' },
                { status: 404 }
            );
        }

        // 2. Mock the params and pass to the original handler
        const params = Promise.resolve({ matchId: String(result.data) });
        return handlerGET(request, { params });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Internal server error while resolving active export' },
            { status: 500 }
        );
    }
}

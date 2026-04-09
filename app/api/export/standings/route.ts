import { NextRequest, NextResponse } from 'next/server';
import { StandingsService } from '@/services/standings';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';
import { generateProductionMatrix } from '@/lib/utils/production-matrix';
import { vmixResponse } from '@/lib/utils/vmix-format';

/**
 * Production API: Standings (Matrix Layout)
 * Supports permanent URL via getActiveParams (resolves active config from DB)
 */
export async function GET(request: NextRequest) {
    try {
        const params = await getActiveParams(request, 'standings');
        const stageId = params.stageId ? Number(params.stageId) : undefined;
        const format = getProductionFormat(request);

        if (!stageId) {
            return NextResponse.json({ success: false, error: 'stageId is required' }, { status: 400 });
        }

        const result = await StandingsService.getBracketStandings(stageId);

        if (!result.success || !result.data) {
            return NextResponse.json({ success: false, error: result.error || 'Failed to fetch standings' }, { status: 404 });
        }

        // Generate the 26x26 matrix specifically requested for vMix production
        const matrix = generateProductionMatrix(result.data.bracket, result.data.stage_name);

        return vmixResponse(
            matrix,
            format,
            'standings',
            {},
            30 // Cache for 30s
        );
    } catch (error: any) {
        console.error('Error in production standings:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

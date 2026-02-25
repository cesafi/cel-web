import { NextRequest, NextResponse } from 'next/server';
import { ValorantMapVetoService } from '@/services/valorant-map-vetoes';

/**
 * Production API: Get map veto sequence for a specific Valorant match
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const id = parseInt(matchId, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    const result = await ValorantMapVetoService.getByMatchId(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: result.data },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  } catch (error: any) {
    console.error('Error in production map vetoes API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

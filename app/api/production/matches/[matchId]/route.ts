import { NextRequest, NextResponse } from 'next/server';
import { MatchesService } from '@/services/matches';

/**
 * Production API: Get match overview (details, participants, scores)
 * Useful for pre-show graphics and match cards
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

    const result = await MatchesService.getMatchById(id);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Match not found' },
        { status: 404 }
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
    console.error('Error in production match overview API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

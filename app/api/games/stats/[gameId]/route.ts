import { NextRequest, NextResponse } from 'next/server';
import { getValorantStatsByGameId } from '@/actions/stats-valorant';
import { getMlbbStatsByGameId } from '@/actions/stats-mlbb';
import { getGameById } from '@/actions/games';
import { getMatchById } from '@/actions/matches';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const id = parseInt(gameId, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    // 1. Fetch the game to find out which esport it belongs to
    const gameResult = await getGameById(id);
    if (!gameResult.success || !gameResult.data) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    const matchResult = await getMatchById(gameResult.data.match_id);
    if (!matchResult.success || !matchResult.data) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    const sport = matchResult.data.esports_seasons_stages?.esports_categories?.esports?.name;

    // 2. Fetch the corresponding stats based on the sport
    let stats = null;
    if (sport === 'Valorant') {
      const statsResult = await getValorantStatsByGameId(id);
      if (statsResult.success) {
        stats = statsResult.data;
      }
    } else if (sport === 'Mobile Legends: Bang Bang') {
      const statsResult = await getMlbbStatsByGameId(id);
      if (statsResult.success) {
        stats = statsResult.data;
      }
    } else {
       return NextResponse.json(
        { success: false, error: `Statistics are not implemented for sport: ${sport}` },
        { status: 501 }
      );
    }

    // 3. Return the data
    return NextResponse.json(
      { success: true, data: stats },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in game stats API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

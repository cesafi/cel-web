import { NextRequest, NextResponse } from 'next/server';
import { getValorantStatsByGameId } from '@/actions/stats-valorant';
import { getMlbbStatsByGameId } from '@/actions/stats-mlbb';
import { getGameById } from '@/actions/games';
import { getMatchById } from '@/actions/matches';
import { vmixResponse, getFormatParam } from '@/lib/utils/vmix-format';
import { getSupabaseServer } from '@/lib/supabase/server';

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

    const format = getFormatParam(request);

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

    // 3. Prepare padded and formatted data for vMix
    const supabase = await getSupabaseServer();
    const { data: gameContext } = await supabase
      .from('games')
      .select(`
            game_number,
            mlbb_map:mlbb_maps(name),
            valorant_map:valorant_maps(name),
            match:matches(
                match_participants(
                    team_id,
                    team:schools_teams(name, school:schools(abbreviation))
                )
            )
        `)
      .eq('id', id)
      .single();

    const mapName = gameContext?.mlbb_map?.name || gameContext?.valorant_map?.name || '';
    const gameNumber = gameContext?.game_number || 1;

    const participants = gameContext?.match?.match_participants || [];
    const teamAId = participants[0]?.team_id;
    const teamBId = participants[1]?.team_id;

    // Helper to safely get school abbreviation or name
    const getTeamName = (p: any) => {
      const team = p?.team;
      if (!team) return '';
      const schoolData = Array.isArray(team.school) ? team.school[0] : team.school;
      return schoolData?.abbreviation || team.name || '';
    };

    const teamAAbbrev = getTeamName(participants[0]);
    const teamBAbbrev = getTeamName(participants[1]);

    if (format !== 'json' && Array.isArray(stats)) {
      const teamAStats = stats.filter((s: any) => s.team_id === teamAId);
      const teamBStats = stats.filter((s: any) => s.team_id === teamBId);

      const maxRows = 5;
      const formattedStats = [];

      for (let i = 0; i < maxRows; i++) {
        const pA: any = teamAStats[i] || {};
        const pB: any = teamBStats[i] || {};

        const playerA: any = pA.players || {};
        const ignA = playerA.ign || '';

        const playerB: any = pB.players || {};
        const ignB = playerB.ign || '';

        // Calculate KDA helper
        const calcKda = (k: number, d: number, a: number) => {
          if (k == null && d == null && a == null) return '';
          const kills = k || 0;
          const deaths = d || 0;
          const assists = a || 0;
          return deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : (kills + assists).toFixed(2);
        };

        formattedStats.push({
          slot: i + 1,
          game_number: gameNumber,
          map: mapName,

          blue_team: teamAAbbrev,
          blue_ign: ignA,
          blue_role: playerA.role || '',
          blue_kills: pA.kills ?? '',
          blue_deaths: pA.deaths ?? '',
          blue_assists: pA.assists ?? '',
          blue_kda: calcKda(pA.kills, pA.deaths, pA.assists),
          blue_acs: pA.acs ?? '',
          blue_first_bloods: pA.first_bloods ?? '',
          blue_gold: pA.gold ?? '',
          blue_damage: pA.damage_dealt ?? '',

          red_team: teamBAbbrev,
          red_ign: ignB,
          red_role: playerB.role || '',
          red_kills: pB.kills ?? '',
          red_deaths: pB.deaths ?? '',
          red_assists: pB.assists ?? '',
          red_kda: calcKda(pB.kills, pB.deaths, pB.assists),
          red_acs: pB.acs ?? '',
          red_first_bloods: pB.first_bloods ?? '',
          red_gold: pB.gold ?? '',
          red_damage: pB.damage_dealt ?? ''
        });
      }
      return vmixResponse(formattedStats, format, 'game_stats');
    }

    // Default JSON structure
    return vmixResponse(
      {
        game_number: gameNumber,
        map: mapName,
        stats: stats
      },
      format,
      'game_stats'
    );
  } catch (error: any) {
    console.error('Error in game stats API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

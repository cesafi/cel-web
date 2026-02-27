import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { StatisticsService } from '@/services/statistics';
import { formatResponse, getFormatParam } from '@/lib/utils/vmix-format';

/**
 * Production API: Head-to-Head Player Comparison
 * Supports mode: direct (from games where they were opponents), overall (full season stats), both
 * Params: playerA, playerB, game (mlbb|valorant), seasonId, mode (direct|overall|both)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerA = searchParams.get('playerA');
    const playerB = searchParams.get('playerB');
    const game = (searchParams.get('game') || 'mlbb') as 'mlbb' | 'valorant';
    const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;
    const mode = (searchParams.get('mode') || 'both') as 'direct' | 'overall' | 'both';
    const format = getFormatParam(request);
    const table = searchParams.get('table') as string | null;

    if (!playerA || !playerB) {
      return NextResponse.json(
        { success: false, error: 'Both playerA and playerB are required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();
    const statsTable = game === 'mlbb' ? 'stats_mlbb_game_player' : 'stats_valorant_game_player';
    const response: any = { success: true, data: {} };

    // --- Direct Head-to-Head ---
    if (mode === 'direct' || mode === 'both') {
      // Find games where both players participated
      const { data: gamesA } = await supabase
        .from(statsTable)
        .select('game_id')
        .eq('player_id', playerA);

      const { data: gamesB } = await supabase
        .from(statsTable)
        .select('game_id')
        .eq('player_id', playerB);

      const gameIdsA = new Set((gamesA || []).map(g => g.game_id));
      const commonGameIds = (gamesB || [])
        .map(g => g.game_id)
        .filter(id => gameIdsA.has(id));

      let directStats: any = { games_played: commonGameIds.length };

      if (commonGameIds.length > 0) {
        // Get stats for each player in common games
        const { data: playerAStats } = await supabase
          .from(statsTable)
          .select('*')
          .eq('player_id', playerA)
          .in('game_id', commonGameIds);

        const { data: playerBStats } = await supabase
          .from(statsTable)
          .select('*')
          .eq('player_id', playerB)
          .in('game_id', commonGameIds);

        const aggregateStats = (rows: any[]) => {
          const totalGames = rows.length;
          const totalKills = rows.reduce((s, r) => s + (r.kills || 0), 0);
          const totalDeaths = rows.reduce((s, r) => s + (r.deaths || 0), 0);
          const totalAssists = rows.reduce((s, r) => s + (r.assists || 0), 0);
          const mvpCount = rows.filter(r => r.is_mvp).length;

          const base: any = {
            total_games: totalGames,
            total_kills: totalKills,
            total_deaths: totalDeaths,
            total_assists: totalAssists,
            mvp_count: mvpCount,
            avg_kills: totalGames > 0 ? totalKills / totalGames : 0,
            avg_deaths: totalGames > 0 ? totalDeaths / totalGames : 0,
            avg_assists: totalGames > 0 ? totalAssists / totalGames : 0,
            kda: totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists,
          };

          // Game-specific stats
          if (game === 'mlbb') {
            base.total_gold = rows.reduce((s, r) => s + (r.gold || 0), 0);
            base.total_damage_dealt = rows.reduce((s, r) => s + (r.damage_dealt || 0), 0);
            base.avg_gold = totalGames > 0 ? base.total_gold / totalGames : 0;
          } else {
            base.avg_acs = totalGames > 0 ? rows.reduce((s, r) => s + (r.acs || 0), 0) / totalGames : 0;
            base.total_first_bloods = rows.reduce((s, r) => s + (r.first_bloods || 0), 0);
          }

          return base;
        };

        directStats.player_a = aggregateStats(playerAStats || []);
        directStats.player_b = aggregateStats(playerBStats || []);
      }

      response.data.direct = directStats;
    }

    // --- Overall Season Stats ---
    if (mode === 'overall' || mode === 'both') {
      const filters = seasonId ? { season_id: seasonId } : undefined;
      const allStats = game === 'mlbb'
        ? await StatisticsService.getMlbbPlayerStats(filters)
        : await StatisticsService.getValorantPlayerStats(filters);

      if (allStats.success && allStats.data) {
        const playerAStats = (allStats.data as any[]).find((p: any) => p.player_id === playerA);
        const playerBStats = (allStats.data as any[]).find((p: any) => p.player_id === playerB);

        response.data.overall = {
          player_a: playerAStats || null,
          player_b: playerBStats || null,
        };
      }
    }

    // Get player info
    const { data: playersInfo } = await supabase
      .from('players')
      .select('id, ign, first_name, last_name, photo_url, role')
      .in('id', [playerA, playerB]);

    response.data.players = {
      player_a: (playersInfo || []).find((p: any) => p.id === playerA) || null,
      player_b: (playersInfo || []).find((p: any) => p.id === playerB) || null,
    };

    // If a specific table is requested (for vMix single data source)
    if (format !== 'json' && table) {
      const tables: Record<string, any> = {
        players: [response.data.players?.player_a, response.data.players?.player_b].filter(Boolean),
        direct: response.data.direct ? [response.data.direct] : [],
        overall: response.data.overall ? [
          { side: 'player_a', ...response.data.overall.player_a },
          { side: 'player_b', ...response.data.overall.player_b },
        ].filter(e => e.side) : [],
      };
      const selected = tables[table];
      if (selected) {
        return formatResponse(selected, format, table);
      }
    }

    return formatResponse(response, format, 'head_to_head_players');
  } catch (error: any) {
    console.error('Error in production H2H players API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

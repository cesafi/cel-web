import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { StatisticsService } from '@/services/statistics';
import { vmixResponse, formatResponse, getFormatParam } from '@/lib/utils/vmix-format';

/**
 * Production API: Head-to-Head Team Comparison
 * Supports mode: direct (only games where teams faced each other), overall (full season stats), both
 * Params: teamA, teamB, game (mlbb|valorant), seasonId, stageId, mode (direct|overall|both)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamA = searchParams.get('teamA');
    const teamB = searchParams.get('teamB');
    const game = (searchParams.get('game') || 'mlbb') as 'mlbb' | 'valorant';
    const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;
    const stageId = searchParams.get('stageId') ? parseInt(searchParams.get('stageId')!) : undefined;
    const mode = (searchParams.get('mode') || 'both') as 'direct' | 'overall' | 'both';
    const format = getFormatParam(request);
    const table = searchParams.get('table') as string | null;

    if (!teamA || !teamB) {
      return NextResponse.json(
        { success: false, error: 'Both teamA and teamB are required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();
    const response: any = { success: true, data: {} };

    // --- Direct Head-to-Head ---
    if (mode === 'direct' || mode === 'both') {
      // Find matches where both teams participated
      const { data: matchesA } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('team_id', teamA);

      const { data: matchesB } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('team_id', teamB);

      const matchIdsA = new Set((matchesA || []).map(m => m.match_id));
      const commonMatchIds = (matchesB || [])
        .map(m => m.match_id)
        .filter(id => matchIdsA.has(id));

      let directStats: any = { matches_played: 0, team_a_wins: 0, team_b_wins: 0, draws: 0, games: [] };

      if (commonMatchIds.length > 0) {
        // Get match details for common matches
        let matchQuery = supabase
          .from('matches')
          .select(`
            id, name, status, scheduled_at,
            match_participants(team_id, match_score),
            esports_seasons_stages(season_id, competition_stage)
          `)
          .in('id', commonMatchIds)
          .order('scheduled_at', { ascending: false });

        if (seasonId) {
          matchQuery = matchQuery.eq('esports_seasons_stages.season_id', seasonId);
        }

        const { data: matches } = await matchQuery;

        if (matches) {
          for (const match of matches) {
            const participants = (match as any).match_participants || [];
            const teamAScore = participants.find((p: any) => p.team_id === teamA)?.match_score || 0;
            const teamBScore = participants.find((p: any) => p.team_id === teamB)?.match_score || 0;

            if (teamAScore > teamBScore) directStats.team_a_wins++;
            else if (teamBScore > teamAScore) directStats.team_b_wins++;
            else directStats.draws++;

            directStats.matches_played++;
          }
        }

        // Get game-level stats for common matches
        const { data: commonGames } = await supabase
          .from('games')
          .select('id, match_id, game_number')
          .in('match_id', commonMatchIds);

        if (commonGames && commonGames.length > 0) {
          const gameIds = commonGames.map(g => g.id);
          const statsTable = game === 'mlbb' ? 'stats_mlbb_game_player' : 'stats_valorant_game_player';

          // Get aggregate stats for each team across their H2H games
          const { data: h2hStatsA } = await supabase
            .from(statsTable)
            .select('*')
            .eq('team_id', teamA)
            .in('game_id', gameIds);

          const { data: h2hStatsB } = await supabase
            .from(statsTable)
            .select('*')
            .eq('team_id', teamB)
            .in('game_id', gameIds);

          const aggregatePlayerStats = (rows: any[]) => {
            const totalGames = new Set(rows.map(r => r.game_id)).size;
            const totalKills = rows.reduce((s, r) => s + (r.kills || 0), 0);
            const totalDeaths = rows.reduce((s, r) => s + (r.deaths || 0), 0);
            const totalAssists = rows.reduce((s, r) => s + (r.assists || 0), 0);
            return {
              total_games: totalGames,
              total_kills: totalKills,
              total_deaths: totalDeaths,
              total_assists: totalAssists,
              avg_kills_per_game: totalGames > 0 ? totalKills / totalGames : 0,
              avg_deaths_per_game: totalGames > 0 ? totalDeaths / totalGames : 0,
              avg_assists_per_game: totalGames > 0 ? totalAssists / totalGames : 0,
            };
          };

          directStats.team_a_stats = aggregatePlayerStats(h2hStatsA || []);
          directStats.team_b_stats = aggregatePlayerStats(h2hStatsB || []);
        }
      }

      response.data.direct = directStats;
    }

    // --- Overall Season Stats ---
    if (mode === 'overall' || mode === 'both') {
      const teamStatsResult = await StatisticsService.getTeamStats(game, seasonId, stageId);

      if (teamStatsResult.success && teamStatsResult.data) {
        const teamAStats = teamStatsResult.data.find((t: any) => t.team_id === teamA);
        const teamBStats = teamStatsResult.data.find((t: any) => t.team_id === teamB);

        response.data.overall = {
          team_a: teamAStats || null,
          team_b: teamBStats || null,
        };
      }
    }

    // Get team info
    const { data: teamsInfo } = await supabase
      .from('schools_teams')
      .select('id, name, schools(id, name, abbreviation, logo_url)')
      .in('id', [teamA, teamB]);

    response.data.teams = {
      team_a: (teamsInfo || []).find((t: any) => t.id === teamA) || null,
      team_b: (teamsInfo || []).find((t: any) => t.id === teamB) || null,
    };

    // If a specific table is requested (for vMix single data source)
    if (format !== 'json' && table) {
      const tables: Record<string, any> = {
        teams: [response.data.teams?.team_a, response.data.teams?.team_b].filter(Boolean),
        direct: response.data.direct ? [response.data.direct] : [],
        overall: response.data.overall ? [
          { side: 'team_a', ...response.data.overall.team_a },
          { side: 'team_b', ...response.data.overall.team_b },
        ].filter(e => e.side) : [],
      };
      const selected = tables[table];
      if (selected) {
        return vmixResponse(selected, format, table);
      }
    }

    return vmixResponse(response.data, format, 'head_to_head_teams');
  } catch (error: any) {
    console.error('Error in production H2H teams API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

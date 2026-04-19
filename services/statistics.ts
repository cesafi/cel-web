import { BaseService } from './base';
import { Database } from '../database.types';
import { ServiceResponse } from '../lib/types/base';

// Types for statistics
export interface PlayerStatsSummary {
  player_id: string;
  player_ign: string;
  player_photo_url: string | null;
  team_id: string | null;
  team_name: string | null;
  team_logo_url: string | null;
  games_played: number;
  total_kills: number;
  total_deaths: number;
  total_assists: number;
  kills_per_game: number;
  deaths_per_game: number;
  assists_per_game: number;
  mvp_count: number;
  wins: number;
}

export interface MlbbPlayerStats extends PlayerStatsSummary {
  hero_name: string | null;
  total_gold: number;
  avg_gpm: number;
  total_damage_dealt: number;
  total_damage_taken: number;
  total_turret_damage: number;
  total_lord_slain: number;
  total_turtle_slain: number;
  teamfight_percent: number;
}

export interface ValorantPlayerStats extends PlayerStatsSummary {
  agent_name: string | null;
  avg_acs: number;
  avg_adr: number;
  avg_hs_percent: number;
  total_first_bloods: number;
  total_plants: number;
  total_defuses: number;
}

export interface StatisticsFilters {
  game: 'mlbb' | 'valorant';
  season_id?: number;
  stage_id?: number;
  school_id?: string;
  division?: string;
  team_id?: string;
  search_query?: string;
  page?: number;
  limit?: number;
}

export interface LeaderboardEntry {
  player_id: string;
  player_ign: string;
  player_photo_url: string | null;
  team_name: string | null;
  team_logo_url: string | null;
  value: number;
  metric_name: string;
}

export class StatisticsService extends BaseService {
  /**
   * Get available categories, optionally filtered by esport (game)
   */
  static async getAvailableCategories(esportId?: number) {
    try {
      const supabase = await this.getClient();

      let query = supabase
        .from('esports_categories')
        .select('id, levels, division, esport_id, esports(id, name)')
        .order('id');

      if (esportId) {
        query = query.eq('esport_id', esportId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Build a readable label from division + levels
      const categories = (data as any[] || []).map((c: any) => ({
        id: c.id,
        levels: c.levels,
        division: c.division,
        esport_id: c.esport_id,
        esport_name: c.esports?.name || '',
        name: `${c.division}${c.levels ? " " + c.levels : ""}`,
      }));

      return { success: true as const, data: categories };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch categories');
    }
  }
  /**
   * Get aggregated MLBB player statistics
   */
  static async getMlbbPlayerStats(
    filters?: Partial<StatisticsFilters>
  ) {
    try {
      const supabase = await this.getClient();

      // Query the Materialized View directly
      let query = supabase
        .from('mv_mlbb_player_stats' as any)
        .select('*');

      // Apply Filters
      if (filters?.season_id) {
        query = query.eq('season_id', filters.season_id);
      }
      if (filters?.stage_id) {
        query = query.eq('stage_id', filters.stage_id);
      }
      // Filter by Team OR School
      let schoolTeamIds: string[] | null = null;
      if (filters?.team_id) {
         query = query.eq('team_id', filters.team_id);
      } else if (filters?.school_id) {
        // Find all team IDs belonging to this school
        const { data: teamsData } = await supabase
          .from('schools_teams')
          .select('id')
          .eq('school_id', filters.school_id);
          
        if (!teamsData || teamsData.length === 0) {
           return { success: true as const, data: [], count: 0 };
        }
        schoolTeamIds = teamsData.map(t => t.id);
        query = query.in('team_id', schoolTeamIds);
      }

      // Filter by Division
      if (filters?.division) {
        // Find categories matching the division, then stages under those categories
        const { data: categoriesData } = await supabase
          .from('esports_categories')
          .select('id')
          .eq('division', filters.division);

        if (!categoriesData || categoriesData.length === 0) {
          return { success: true as const, data: [], count: 0 };
        }
        
        const categoryIds = categoriesData.map(c => c.id);

        const { data: stages } = await supabase
          .from('esports_seasons_stages')
          .select('id')
          .in('esport_category_id', categoryIds);

        if (stages && stages.length > 0) {
          query = query.in('stage_id', stages.map(s => s.id));
        } else {
          return { success: true as const, data: [], count: 0 };
        }
      }

      // We DON'T use DB pagination here because we need to aggregate rows first.
      // E.g. A player has 2 rows (Stage 1, Stage 2), we need to combine them.

      const { data, error } = await query;

      if (error) throw error;

      const rawData = data as any[] || [];

      // Aggregate by player_id
      const playerMap = new Map<string, any>();

      rawData.forEach(row => {
        const existing = playerMap.get(row.player_id);
        if (!existing) {
          playerMap.set(row.player_id, { ...row });
        } else {
          // Aggregate
          existing.games_played += row.games_played;
          existing.wins += row.wins;
          existing.mvp_count += row.mvp_count;
          existing.total_kills += row.total_kills;
          existing.total_deaths += row.total_deaths;
          existing.total_assists += row.total_assists;
          existing.total_gold += row.total_gold;
          existing.total_damage_dealt += row.total_damage_dealt;
          existing.total_damage_taken += row.total_damage_taken;
          existing.total_turret_damage += row.total_turret_damage;
          existing.total_lord_slain += row.total_lord_slain;
          existing.total_turtle_slain += row.total_turtle_slain;

          // Weighted averages for rating/teamfight
          const totalGames = existing.games_played; // already updated above? No, wait. 
          // Let's do it carefully.
          // existing is the accumulator. row is the new chunk.
          // We need pre-update games for weighting
          const g1 = existing.games_played - row.games_played;
          const g2 = row.games_played;
          const gTotal = g1 + g2;

          if (gTotal > 0) {
            existing.avg_teamfight_percent = ((existing.avg_teamfight_percent * g1) + (row.avg_teamfight_percent * g2)) / gTotal;
            existing.avg_rating = ((existing.avg_rating * g1) + (row.avg_rating * g2)) / gTotal;
          }
        }
      });

      const aggregatedData = Array.from(playerMap.values());

      // Recalculate derived averages based on final totals
      aggregatedData.forEach(p => {
        const g = p.games_played || 1;
        p.kills_per_game = p.total_kills / g;
        p.deaths_per_game = p.total_deaths / g;
        p.assists_per_game = p.total_assists / g;
        p.avg_gpm = p.total_gold / g;
        // Ensure formatting if needed, but numbers are fine
      });

      let resultData = aggregatedData;

      // Perform search filtering before pagination
      if (filters?.search_query) {
        const lowerSearch = filters.search_query.toLowerCase();
        resultData = resultData.filter(p =>
          p.player_ign?.toLowerCase().includes(lowerSearch) ||
          p.team_name?.toLowerCase().includes(lowerSearch) ||
          p.school_abbreviation?.toLowerCase().includes(lowerSearch) ||
          p.hero_name?.toLowerCase().includes(lowerSearch)
        );
      }

      // Handle in-memory pagination if needed, but usually we return all
      // The frontend requested "VLR style" (all rows), so we return all.
      // But if explicit page/limit was passed, we mock it.
      const totalCount = resultData.length;
      if (filters?.page && filters?.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit;
        resultData = resultData.slice(from, to);
      }

      return {
        success: true as const,
        data: resultData as unknown as MlbbPlayerStats[],
        count: totalCount
      };
    } catch (error) {
      return this.formatError<MlbbPlayerStats[]>(error, 'Failed to fetch MLBB stats');
    }
  }

  /**
   * Get aggregated Valorant player statistics
   */
  static async getValorantPlayerStats(
    filters?: Partial<StatisticsFilters>
  ) {
    try {
      const supabase = await this.getClient();

      // Query the Materialized View directly
      let query = supabase
        .from('mv_valorant_player_stats' as any)
        .select('*');

      // Apply Filters
      if (filters?.season_id) {
        query = query.eq('season_id', filters.season_id);
      }
      if (filters?.stage_id) {
        query = query.eq('stage_id', filters.stage_id);
      }
      
      // Filter by Team OR School
      if (filters?.team_id) {
         query = query.eq('team_id', filters.team_id);
      } else if (filters?.school_id) {
        const { data: teamsData } = await supabase
          .from('schools_teams')
          .select('id')
          .eq('school_id', filters.school_id);
          
        if (!teamsData || teamsData.length === 0) {
           return { success: true as const, data: [], count: 0 };
        }
        const schoolTeamIds = teamsData.map(t => t.id);
        query = query.in('team_id', schoolTeamIds);
      }

      // Filter by Division
      if (filters?.division) {
        const { data: categoriesData } = await supabase
          .from('esports_categories')
          .select('id')
          .eq('division', filters.division);

        if (!categoriesData || categoriesData.length === 0) {
          return { success: true as const, data: [], count: 0 };
        }
        
        const categoryIds = categoriesData.map(c => c.id);

        const { data: stages } = await supabase
          .from('esports_seasons_stages')
          .select('id')
          .in('esport_category_id', categoryIds);

        if (stages && stages.length > 0) {
          query = query.in('stage_id', stages.map(s => s.id));
        } else {
          return { success: true as const, data: [], count: 0 };
        }
      }

      // No DB pagination, fetch all then aggregate
      const { data, error } = await query;

      if (error) throw error;

      const rawData = data as any[] || [];
      const playerMap = new Map<string, any>();

      rawData.forEach(row => {
        const existing = playerMap.get(row.player_id);
        if (!existing) {
          playerMap.set(row.player_id, { ...row });
        } else {
          // Aggregate
          existing.games_played += row.games_played;
          existing.wins += row.wins;
          existing.mvp_count += row.mvp_count;
          existing.total_kills += row.total_kills;
          existing.total_deaths += row.total_deaths;
          existing.total_assists += row.total_assists;

          existing.total_first_bloods += row.total_first_bloods;
          existing.total_plants += row.total_plants;
          existing.total_defuses += row.total_defuses;

          // Weighted averages for ACS/Econ
          const g1 = existing.games_played - row.games_played;
          const g2 = row.games_played;
          const gTotal = g1 + g2;

          if (gTotal > 0) {
            existing.avg_acs = ((existing.avg_acs * g1) + (row.avg_acs * g2)) / gTotal;
            existing.avg_econ_rating = ((existing.avg_econ_rating * g1) + (row.avg_econ_rating * g2)) / gTotal;
          }
        }
      });

      const aggregatedData = Array.from(playerMap.values());

      // Recalculate derived averages
      aggregatedData.forEach(p => {
        const g = p.games_played || 1;
        p.kills_per_game = p.total_kills / g;
        p.deaths_per_game = p.total_deaths / g;
        p.assists_per_game = p.total_assists / g;
      });

      let resultData = aggregatedData;

      // Perform search filtering before pagination
      if (filters?.search_query) {
        const lowerSearch = filters.search_query.toLowerCase();
        resultData = resultData.filter(p =>
          p.player_ign?.toLowerCase().includes(lowerSearch) ||
          p.team_name?.toLowerCase().includes(lowerSearch) ||
          p.school_abbreviation?.toLowerCase().includes(lowerSearch) ||
          p.agent_name?.toLowerCase().includes(lowerSearch)
        );
      }

      // Handle in-memory pagination
      const totalCount = resultData.length;
      if (filters?.page && filters?.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit;
        resultData = resultData.slice(from, to);
      }

      return {
        success: true as const,
        data: resultData as unknown as ValorantPlayerStats[],
        count: totalCount
      };
    } catch (error) {
      return this.formatError<ValorantPlayerStats[]>(error, 'Failed to fetch Valorant stats');
    }
  }

  /**
   * Get stats for a single game
   */
  static async getGameStats(
    gameId: number,
    type: 'mlbb' | 'valorant'
  ) {
    try {
      const supabase = await this.getClient();
      const tableName = type === 'mlbb' ? 'stats_mlbb_game_player' : 'stats_valorant_game_player';

      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          *,
          players (
            id,
            ign,
            photo_url,
            schools_teams (id, name, logo_url)
          )
        `)
        .eq('game_id', gameId);

      if (error) throw error;

      return { success: true as const, data: data as any[] };
    } catch (error) {
      return this.formatError(error, `Failed to fetch ${type} game stats`);
    }
  }

  /**
   * Get top players for a specific metric (leaderboard)
   * Queries the MV directly with ORDER BY and LIMIT to avoid full data dump.
   */
  static async getLeaderboard(
    game: 'mlbb' | 'valorant',
    metric: string,
    limit: number = 5,
    seasonId?: number,
    division?: string,
    minGames?: number
  ): Promise<{ success: boolean; data?: LeaderboardEntry[]; error?: string }> {
    try {
      const supabase = await this.getClient();

      const viewName = game === 'mlbb' ? 'mv_mlbb_player_stats' : 'mv_valorant_player_stats';
      
      // Tiebreaker: avg_acs for Valorant, avg_rating for MLBB
      const tiebreaker = game === 'valorant' ? 'avg_acs' : 'avg_rating';

      // Select only the fields needed for leaderboard display + the metric column + tiebreaker
      let query = supabase
        .from(viewName as any)
        .select(`player_id, player_ign, player_photo_url, team_name, team_logo_url, games_played, ${metric}, ${tiebreaker}`)
        .order(metric, { ascending: false, nullsFirst: false })
        .order(tiebreaker, { ascending: false, nullsFirst: false })
        .limit(limit);

      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }

      // Filter by division (resolve through categories → stages)
      if (division) {
        const { data: categoriesData } = await supabase
          .from('esports_categories')
          .select('id')
          .eq('division', division);

        if (!categoriesData || categoriesData.length === 0) {
          return { success: true, data: [] };
        }

        const categoryIds = categoriesData.map(c => c.id);

        const { data: stages } = await supabase
          .from('esports_seasons_stages')
          .select('id')
          .in('esport_category_id', categoryIds);

        if (stages && stages.length > 0) {
          query = query.in('stage_id', stages.map(s => s.id));
        } else {
          return { success: true, data: [] };
        }
      }

      // Filter by minimum games played
      if (minGames && minGames > 0) {
        query = query.gte('games_played', minGames);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return { success: true, data: [] };
      }

      const leaderboard: LeaderboardEntry[] = (data as any[]).map(player => ({
        player_id: player.player_id,
        player_ign: player.player_ign,
        player_photo_url: player.player_photo_url,
        team_name: player.team_name,
        team_logo_url: player.team_logo_url,
        value: player[metric] || 0,
        metric_name: metric
      }));

      return { success: true, data: leaderboard };
    } catch (error) {
      return this.formatError<LeaderboardEntry[]>(error, 'Failed to fetch leaderboard');
    }
  }

  /**
   * Get aggregated hero statistics for MLBB
   * 
   * Without teamId: reads total_bans from the materialized view (fast, global stats).
   * With teamId: queries game_draft_actions for team-specific ban counts (for production/export).
   */
  static async getHeroStats(
    seasonId?: number,
    stageId?: number,
    division?: string,
    schoolId?: string,
    teamId?: string
  ) {
    try {
      const supabase = await this.getClient();

      let query = supabase
        .from('mv_mlbb_hero_stats' as any)
        .select('*');

      if (seasonId) query = query.eq('season_id', seasonId);
      if (stageId) query = query.eq('stage_id', stageId);
      
      // Division filter handling
      if (division) {
         const { data: categoriesData } = await supabase
          .from('esports_categories')
          .select('id')
          .eq('division', division);
          
         if (categoriesData && categoriesData.length > 0) {
            query = query.in('category_id', categoriesData.map(c => c.id));
         } else {
            // Force empty results safely if missing matching division 
            query = query.in('category_id', []); 
         }
      }

      // Apply team filters BEFORE executing the query
      if (teamId) {
        query = query.eq('team_id', teamId);
      } else if (schoolId) {
        // Resolve schoolId -> teamIds
        const { data: teamsData } = await supabase
          .from('schools_teams')
          .select('id')
          .eq('school_id', schoolId);
          
        const teamIds = (teamsData || []).map(t => t.id);
        
        if (teamIds.length === 0) {
           return { success: true as const, data: [] };
        }
        query = query.in('team_id', teamIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregation Map
      const heroMap = new Map<string, any>();
      const rows = (data as any[]) || [];

      for (const row of rows) {
        const id = row.hero_id;
        const existing = heroMap.get(id);

        if (existing) {
          existing.total_picks += row.total_picks;
          existing.total_bans += row.total_bans || 0;
          existing.total_wins += row.total_wins;
          existing.total_kills += row.total_kills;
          existing.total_deaths += row.total_deaths;
          existing.total_assists += row.total_assists;
          existing.avg_gold += row.avg_gold * row.total_picks; // Weighted sum
          existing.avg_damage += row.avg_damage * row.total_picks; // Weighted sum
        } else {
          heroMap.set(id, {
            ...row,
            total_bans: row.total_bans || 0,
            avg_gold: row.avg_gold * row.total_picks, // Init weighted sum
            avg_damage: row.avg_damage * row.total_picks, // Init weighted sum
          });
        }
      }

      // Compute totalGames for calculating perfectly accurate pick/ban rates
      let totalPicks = 0;
      for (const hero of heroMap.values()) {
        totalPicks += hero.total_picks;
      }
      
      let totalGames = 1;
      if (teamId || schoolId) {
        // If filtered to a specific team (or school teams), they pick 5 heroes per game
        totalGames = Math.round(totalPicks / 5);
      } else {
        // Globally, there are 10 picks per game
        totalGames = Math.round(totalPicks / 10); 
      }
      if (totalGames < 1) totalGames = 1;

      const results = Array.from(heroMap.values()).map(row => {
        const picks = row.total_picks;
        const total_bans = row.total_bans;
        
        const avg_kills = picks > 0 ? row.total_kills / picks : 0;
        const avg_deaths = picks > 0 ? row.total_deaths / picks : 0;
        const avg_assists = picks > 0 ? row.total_assists / picks : 0;
        const avg_kda = row.total_deaths > 0 ? (row.total_kills + row.total_assists) / row.total_deaths : (row.total_kills + row.total_assists);

        return {
          hero_id: row.hero_id,
          hero_name: row.hero_name,
          icon_url: row.icon_url,
          season_id: seasonId || row.season_id,
          total_picks: picks,
          total_bans,
          total_wins: row.total_wins,
          total_kills: row.total_kills,
          total_deaths: row.total_deaths,
          total_assists: row.total_assists,

          games_played: picks,
          pick_rate: totalGames > 0 ? (picks / totalGames) * 100 : 0,
          ban_rate: totalGames > 0 ? (total_bans / totalGames) * 100 : 0,
          win_rate: picks > 0 ? (row.total_wins / picks) * 100 : 0,
          avg_gold: picks > 0 ? row.avg_gold / picks : 0,
          avg_damage_dealt: picks > 0 ? row.avg_damage / picks : 0,

          // Added averages
          avg_kills,
          avg_deaths,
          avg_assists,
          avg_kda
        };
      });



      // Sort by picks (desc)
      results.sort((a, b) => b.total_picks - a.total_picks);

      return { success: true as const, data: results };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch hero stats');
    }
  }

  /**
   * Get aggregated agent statistics for Valorant
   */
  static async getAgentStats(
    seasonId?: number,
    stageId?: number,
    division?: string,
    schoolId?: string,
    teamId?: string
  ) {
    try {
      const supabase = await this.getClient();

      let query = supabase
        .from('mv_valorant_agent_stats' as any)
        .select('*');

      if (seasonId) query = query.eq('season_id', seasonId);
      if (stageId) query = query.eq('stage_id', stageId);
      
      if (division) {
         const { data: categoriesData } = await supabase
          .from('esports_categories')
          .select('id')
          .eq('division', division);
          
         if (categoriesData && categoriesData.length > 0) {
            query = query.in('category_id', categoriesData.map(c => c.id));
         } else {
            query = query.in('category_id', []); 
         }
      }

      // If teamId is passed, apply specific team filter
      if (teamId) {
         query = query.eq('team_id', teamId);
      } else if (schoolId) {
        const { data: teamsData } = await supabase
          .from('schools_teams')
          .select('id')
          .eq('school_id', schoolId);
        const teamIds = (teamsData || []).map(t => t.id);
        if (teamIds.length > 0) {
          query = query.in('team_id', teamIds);
        } else {
          return { success: true as const, data: [] };
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregation Map
      const agentMap = new Map<string, any>();
      const rows = (data as any[]) || [];

      for (const row of rows) {
        const id = row.agent_id;
        const existing = agentMap.get(id);

        if (existing) {
          existing.total_picks += row.total_picks;
          existing.total_wins += row.total_wins;
          existing.total_kills += row.total_kills;
          existing.total_deaths += row.total_deaths;
          existing.total_assists += row.total_assists;
          existing.avg_acs += row.avg_acs * row.total_picks; // Weighted
          existing.total_first_bloods += row.total_first_bloods;
        } else {
          agentMap.set(id, {
            ...row,
            avg_acs: row.avg_acs * row.total_picks // Init weighted
          });
        }
      }

      const results = Array.from(agentMap.values()).map(row => {
        const picks = row.total_picks;
        const avg_kills = picks > 0 ? row.total_kills / picks : 0;
        const avg_deaths = picks > 0 ? row.total_deaths / picks : 0;
        const avg_assists = picks > 0 ? row.total_assists / picks : 0;
        const avg_kda = row.total_deaths > 0 ? (row.total_kills + row.total_assists) / row.total_deaths : (row.total_kills + row.total_assists);

        return {
          agent_id: row.agent_id,
          agent_name: row.agent_name,
          icon_url: row.icon_url,
          agent_role: row.agent_role,
          season_id: seasonId || row.season_id,
          total_picks: picks,
          total_wins: row.total_wins,
          total_kills: row.total_kills,
          total_deaths: row.total_deaths,
          total_assists: row.total_assists,

          games_played: picks,
          win_rate: picks > 0 ? (row.total_wins / picks) * 100 : 0,
          avg_acs: picks > 0 ? row.avg_acs / picks : 0,
          avg_first_bloods: picks > 0 ? row.total_first_bloods / picks : 0,

          // Added averages
          avg_kills,
          avg_deaths,
          avg_assists,
          avg_kda
        };
      });

      // Sort by picks
      results.sort((a, b) => b.total_picks - a.total_picks);

      return { success: true as const, data: results };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch agent stats');
    }
  }

  /**
   * Get map statistics for Valorant
   */
  static async getMapStats(
    seasonId?: number,
    stageId?: number,
    schoolId?: string,
    teamId?: string
  ) {
    try {
      const supabase = await this.getClient();

      let query = supabase.from('mv_valorant_map_stats' as any).select('*');

      if (stageId) {
        query = query.eq('stage_id', stageId);
      }
      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }

      // If teamId is passed, apply specific team filter
      if (teamId) {
         query = query.eq('team_id', teamId);
      } else if (schoolId) {
        const { data: teamsData } = await supabase
          .from('schools_teams')
          .select('id')
          .eq('school_id', schoolId);
        const teamIds = (teamsData || []).map(t => t.id);
        if (teamIds.length > 0) {
          query = query.in('team_id', teamIds);
        } else {
          return { success: true as const, data: [] };
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group and aggregate across stages/seasons
      const mapStats = new Map<string, any>();
      const rows = (data as any[]) || [];

      let totalFilteredMatches = 0; // Sum across unique matches if we can, 
      // but total_games is derived from total picks/bans, per Map.
      // Easiest is to sum total_picks + total_bans globally from the row perspective 
      // where action was pick/ban. Wait, we don't have totalMatches easily without a subquery.
      // Let's sum total_picks across all maps to get total matches played if 1 map is picked per match!
      // Actually, a BO3 has multiple picks. Let's just aggregate the raw picks/bans per map.

      for (const row of rows) {
        const mapName = row.map_name;
        const existing = mapStats.get(mapName);

        if (existing) {
          existing.total_picks += row.total_picks;
          existing.total_bans += row.total_bans;
          existing.total_games += row.total_games;
        } else {
          mapStats.set(mapName, {
            ...row,
            total_picks: row.total_picks,
            total_bans: row.total_bans,
            total_games: row.total_games,
          });
        }
      }

      // Calculate total matches for rate calculation. We can guess it from total picks / maps per match, 
      // but a better approximation is the sum of picks + bans if veto rules are strict, 
      // or we just return percentages based on (map picks / total matches).
      // Since map stats uses totalMatches, let's find the max picks+bans.

      // We'll calculate total stage matches if we had it, but let's aggregate pick_rate safely:
      // Actually, picking is usually 1 map per match in BO1, more in BO3.
      // Let's just use the sum of total_games across all maps as the denominator / X. 
      // As a simplification, we will use total_games directly for pick_rate = (picks / total_games)
      let totalMapsPlayed = 0;
      for (const row of mapStats.values()) {
        totalMapsPlayed += row.total_games;
      }

      const results = Array.from(mapStats.values()).map(map => {
        return {
          map_id: map.map_id,
          map_name: map.map_name,
          splash_image_url: map.splash_image_url,
          total_games: map.total_games,
          total_picks: map.total_picks,
          // Calculate pick rate relative to all maps played
          pick_rate: totalMapsPlayed > 0 ? (map.total_games / totalMapsPlayed) * 100 : 0,
          total_bans: map.total_bans,
          ban_rate: totalMapsPlayed > 0 ? (map.total_bans / totalMapsPlayed) * 100 : 0,
          attack_wins: 0, // Placeholder
          defense_wins: 0,
          attack_win_rate: 50,
          defense_win_rate: 50,
        };
      });

      // Sort by pick rate
      results.sort((a, b) => b.pick_rate - a.pick_rate);

      return { success: true as const, data: results };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch map stats');
    }
  }

  /**
   * Get team statistics
   */
  static async getTeamStats(
    game: 'mlbb' | 'valorant',
    seasonId?: number,
    stageId?: number,
    division?: string
  ) {
    try {
      const supabase = await this.getClient();

      const tableName = game === 'mlbb' ? 'mv_mlbb_team_stats' : 'mv_valorant_team_stats';

      let query = supabase
        .from(tableName as any)
        .select('*');

      // Apply Filters
      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }
      if (stageId) {
        query = query.eq('stage_id', stageId);
      }
      
      if (division) {
         const { data: categoriesData } = await supabase
          .from('esports_categories')
          .select('id')
          .eq('division', division);
          
         if (categoriesData && categoriesData.length > 0) {
            query = query.in('category_id', categoriesData.map(c => c.id));
         } else {
            query = query.in('category_id', []); 
         }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by team_id to aggregate across stages if needed (when no stage filter is applied)
      // The MV is granualar by stage. If the user wants "Season" stats, we sum up the stages.

      const teamMap = new Map<string, any>();
      const rows = (data as any[]) || [];

      for (const row of rows) {
        const teamId = row.team_id;
        const existing = teamMap.get(teamId);

        if (existing) {
          existing.games_played += row.games_played;
          existing.wins += row.wins;
          existing.total_kills += row.total_kills;
          existing.total_deaths += row.total_deaths;
          existing.total_assists += row.total_assists;

          if (game === 'mlbb') {
            existing.total_gold += row.total_gold || 0;
            existing.total_damage += row.total_damage_dealt || 0;
            existing.total_turret_damage += row.total_turret_damage || 0;
            existing.total_lord_slain += row.total_lord_slain || 0;
            existing.total_turtle_slain += row.total_turtle_slain || 0;
          } else {
            existing.total_acs += (row.avg_acs || 0) * row.games_played;
            existing.total_econ_rating += (row.avg_econ_rating || 0) * row.games_played;
            existing.total_first_bloods += row.total_first_bloods || 0;
            existing.total_plants += row.total_plants || 0;
            existing.total_defuses += row.total_defuses || 0;
          }
        } else {
          const newEntry = {
            team_id: row.team_id,
            team_name: row.team_name,
            school_name: row.school_name,
            school_abbreviation: row.school_abbreviation,
            school_logo_url: row.school_logo_url,
            games_played: row.games_played,
            wins: row.wins,
            total_kills: row.total_kills,
            total_deaths: row.total_deaths,
            total_assists: row.total_assists,
            // Init game-specific
            ...(game === 'mlbb' ? {
              total_gold: row.total_gold || 0,
              total_damage: row.total_damage_dealt || 0,
              total_turret_damage: row.total_turret_damage || 0,
              total_lord_slain: row.total_lord_slain || 0,
              total_turtle_slain: row.total_turtle_slain || 0,
            } : {
              total_acs: (row.avg_acs || 0) * row.games_played,
              total_econ_rating: (row.avg_econ_rating || 0) * row.games_played,
              total_first_bloods: row.total_first_bloods || 0,
              total_plants: row.total_plants || 0,
              total_defuses: row.total_defuses || 0,
            })
          };
          teamMap.set(teamId, newEntry);
        }
      }

      // Calculate derived stats
      const results = Array.from(teamMap.values()).map(team => ({
        team_id: team.team_id,
        team_name: team.team_name,
        team_logo_url: team.school_logo_url,
        school_name: team.school_name,
        school_abbreviation: team.school_abbreviation,
        school_logo_url: team.school_logo_url,
        games_played: team.games_played,
        total_wins: team.wins,
        total_losses: team.games_played - team.wins,
        win_rate: team.games_played > 0 ? (team.wins / team.games_played) * 100 : 0,
        total_kills: team.total_kills,
        total_deaths: team.total_deaths,
        total_assists: team.total_assists,
        avg_kills_per_game: team.games_played > 0 ? team.total_kills / team.games_played : 0,
        avg_deaths_per_game: team.games_played > 0 ? team.total_deaths / team.games_played : 0,
        avg_assists_per_game: team.games_played > 0 ? team.total_assists / team.games_played : 0,
        // MLBB specific
        avg_gold_per_game: team.total_gold && team.games_played > 0 ? team.total_gold / team.games_played : undefined,
        avg_damage_per_game: team.total_damage && team.games_played > 0 ? team.total_damage / team.games_played : undefined,
        total_turret_damage: team.total_turret_damage,
        total_lord_slain: team.total_lord_slain,
        total_turtle_slain: team.total_turtle_slain,
        // Valorant specific
        avg_acs: team.total_acs && team.games_played > 0 ? team.total_acs / team.games_played : undefined,
        avg_econ_rating: team.total_econ_rating && team.games_played > 0 ? team.total_econ_rating / team.games_played : undefined,
        total_first_bloods: team.total_first_bloods,
        total_plants: team.total_plants,
        total_defuses: team.total_defuses,
      }));

      // Sort by win rate
      results.sort((a, b) => b.win_rate - a.win_rate);

      return { success: true as const, data: results };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch team stats');
    }
  }

  /**
   * Get per-player character (hero/agent) stats from raw game tables
   */
  static async getPlayerCharacterStats(
    playerId: string,
    game: 'mlbb' | 'valorant'
  ) {
    try {
      const supabase = await this.getClient();
      const tableName = game === 'mlbb' ? 'stats_mlbb_game_player' : 'stats_valorant_game_player';

      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          *,
          game_characters (
            id,
            name,
            icon_url
          )
        `)
        .eq('player_id', playerId);

      if (error) throw error;

      const rows = (data as any[]) || [];

      // Aggregate by character
      const charMap = new Map<number, any>();
      for (const row of rows) {
        const charId = row.game_character_id;
        if (!charId) continue;
        const existing = charMap.get(charId);
        const wins = row.is_mvp != null ? 1 : 0; // Placeholder — we don't have win data per-row directly

        if (existing) {
          existing.games_played += 1;
          existing.total_kills += row.kills || 0;
          existing.total_deaths += row.deaths || 0;
          existing.total_assists += row.assists || 0;
          existing.total_mvps += row.is_mvp ? 1 : 0;
          if (game === 'mlbb') {
            existing.total_gold += row.gold || 0;
            existing.total_damage += row.damage_dealt || 0;
            existing.rating_sum += row.rating || 0;
          }
          if (game === 'valorant') {
            existing.total_acs += row.acs || 0;
            existing.total_first_bloods += row.first_bloods || 0;
          }
        } else {
          charMap.set(charId, {
            character_id: charId,
            character_name: row.game_characters?.name || 'Unknown',
            icon_url: row.game_characters?.icon_url || null,
            games_played: 1,
            total_kills: row.kills || 0,
            total_deaths: row.deaths || 0,
            total_assists: row.assists || 0,
            total_mvps: row.is_mvp ? 1 : 0,
            ...(game === 'mlbb' ? {
              total_gold: row.gold || 0,
              total_damage: row.damage_dealt || 0,
              rating_sum: row.rating || 0,
            } : {
              total_acs: row.acs || 0,
              total_first_bloods: row.first_bloods || 0,
            }),
          });
        }
      }

      // Calculate averages
      const results = Array.from(charMap.values()).map(c => {
        const g = c.games_played || 1;
        const kda = c.total_deaths > 0
          ? ((c.total_kills + c.total_assists) / c.total_deaths)
          : (c.total_kills + c.total_assists);
        return {
          ...c,
          avg_kills: c.total_kills / g,
          avg_deaths: c.total_deaths / g,
          avg_assists: c.total_assists / g,
          avg_kda: kda,
          ...(game === 'mlbb' ? {
            avg_gold: c.total_gold / g,
            avg_damage: c.total_damage / g,
            avg_rating: c.rating_sum / g,
          } : {
            avg_acs: c.total_acs / g,
            avg_first_bloods: c.total_first_bloods / g,
          }),
        };
      });

      // Sort by games played desc
      results.sort((a, b) => b.games_played - a.games_played);

      return { success: true as const, data: results };
    } catch (error) {
      return this.formatError<any[]>(error, `Failed to fetch player character stats`);
    }
  }

  /**
   * Get available seasons for filter dropdown
   */
  static async getAvailableSeasons() {
    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase
        .from('seasons')
        .select('id, name, start_at, end_at')
        .order('start_at', { ascending: false });

      if (error) throw error;

      // Return raw data to let frontend handle labeling
      return { success: true as const, data: data as any[] };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch seasons');
    }
  }

  /**
   * Get available stages for a season
   */
  /**
   * Get available stages for a season, optionally filtered by category
   */
  static async getStagesBySeason(seasonId: number, division?: string) {
    try {
      const supabase = await this.getClient();

      let query = supabase
        .from('esports_seasons_stages')
        .select(`
          id,
          competition_stage,
          start_date,
          end_date,
          esport_category_id,
          esports_categories (
            id,
            division,
            levels,
            esport_id,
            esports(id, name)
          )
        `)
        .eq('season_id', seasonId);

      if (division) {
        // Resolve division back to categories
        const { data: categoriesData } = await supabase
          .from('esports_categories')
          .select('id')
          .eq('division', division);
          
        if (categoriesData && categoriesData.length > 0) {
           query = query.in('esport_category_id', categoriesData.map(c => c.id));
        } else {
           return { success: true as const, data: [] };
        }
      }

      const { data, error } = await query.order('start_date', { ascending: true });
      if (error) throw error;

      const options = (data || []).map((stage: any) => ({
        id: stage.id,
        label: `${stage.esports_categories?.esports?.name || ''} - ${stage.competition_stage}`,
        value: stage.id,
        category: stage.esports_categories,
        competition_stage: stage.competition_stage,
        esport_category_id: stage.esport_category_id,
      }));

      return { success: true as const, data: options };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch stages');
    }
  }

  /**
   * Get head-to-head statistics for two players
   */
  static async getPlayerH2H(
    game: 'mlbb' | 'valorant', 
    playerAId: string, 
    playerBId: string, 
    filters?: Partial<StatisticsFilters>
  ): Promise<ServiceResponse<{ playerA: any; playerB: any }>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.rpc('get_h2h_comparison', {
        p_game: game,
        p_type: 'players',
        p_id_a: playerAId,
        p_id_b: playerBId,
        p_season_id: filters?.season_id,
        p_stage_id: filters?.stage_id
      });

      if (error) throw error;
      const result = data as any;

      return {
        success: true,
        data: {
          playerA: result.a || null,
          playerB: result.b || null
        }
      };
    } catch (error) {
      return this.formatError(error, 'Failed to fetch player H2H stats');
    }
  }

  /**
   * Get head-to-head statistics for two teams
   */
  static async getTeamH2H(
    game: 'mlbb' | 'valorant', 
    teamAId: string, 
    teamBId: string, 
    filters?: Partial<StatisticsFilters>
  ): Promise<ServiceResponse<{ teamA: any; teamB: any }>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.rpc('get_h2h_comparison', {
        p_game: game,
        p_type: 'teams',
        p_id_a: teamAId,
        p_id_b: teamBId,
        p_season_id: filters?.season_id,
        p_stage_id: filters?.stage_id
      });

      if (error) throw error;
      const result = data as any;

      return {
        success: true,
        data: {
          teamA: result.a || null,
          teamB: result.b || null
        }
      };
    } catch (error) {
      return this.formatError(error, 'Failed to fetch team H2H stats');
    }
  }
}


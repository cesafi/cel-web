import { BaseService } from './base';
import { Database } from '../database.types';

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
}

export interface MlbbPlayerStats extends PlayerStatsSummary {
  hero_name: string | null;
  total_gold: number;
  avg_gpm: number;
  total_damage_dealt: number;
  total_damage_taken: number;
  total_turret_damage: number;
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
  team_id?: string;
  season_id?: number;
  stage_id?: number;
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
   * Get aggregated MLBB player statistics
   */
  static async getMlbbPlayerStats(
    filters?: Partial<StatisticsFilters>
  ) {
    try {
      const supabase = await this.getClient();

      // Use RPC or complex query for aggregation
      // For now, fetch raw stats and aggregate in JS
      let query = supabase
        .from('stats_mlbb_game_player' as any)
        .select(`
          *,
          players!inner(id, ign, photo_url, team_id,
            schools_teams(id, name, logo_url)
          ),
          games!inner(id, match_id,
            matches(stage_id,
              esports_seasons_stages(season_id)
            )
          )
        `);

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate by player
      const playerMap = new Map<string, MlbbPlayerStats>();
      const rows = (data as any[]) || [];

      for (const row of rows) {
        const playerId = row.player_id;
        const existing = playerMap.get(playerId);

        if (existing) {
          existing.games_played++;
          existing.total_kills += row.kills || 0;
          existing.total_deaths += row.deaths || 0;
          existing.total_assists += row.assists || 0;
          existing.total_gold += row.gold || 0;
          existing.total_damage_dealt += row.damage_dealt || 0;
          existing.total_damage_taken += row.damage_taken || 0;
          existing.total_turret_damage += row.turret_damage || 0;
          if (row.is_mvp) existing.mvp_count++;
        } else {
          const player = row.players as any;
          const team = player?.schools_teams as any;
          
          playerMap.set(playerId, {
            player_id: playerId,
            player_ign: player?.ign || 'Unknown',
            player_photo_url: player?.photo_url,
            team_id: player?.team_id,
            team_name: team?.name || null,
            team_logo_url: team?.logo_url || null,
            games_played: 1,
            total_kills: row.kills || 0,
            total_deaths: row.deaths || 0,
            total_assists: row.assists || 0,
            kills_per_game: 0,
            deaths_per_game: 0,
            assists_per_game: 0,
            mvp_count: row.is_mvp ? 1 : 0,
            hero_name: row.hero_name,
            total_gold: row.gold || 0,
            avg_gpm: 0,
            total_damage_dealt: row.damage_dealt || 0,
            total_damage_taken: row.damage_taken || 0,
            total_turret_damage: row.turret_damage || 0,
            teamfight_percent: 0
          });
        }
      }

      // Calculate averages
      const results = Array.from(playerMap.values()).map(player => ({
        ...player,
        kills_per_game: player.games_played > 0 ? player.total_kills / player.games_played : 0,
        deaths_per_game: player.games_played > 0 ? player.total_deaths / player.games_played : 0,
        assists_per_game: player.games_played > 0 ? player.total_assists / player.games_played : 0,
        avg_gpm: player.games_played > 0 ? player.total_gold / player.games_played : 0
      }));

      return { success: true as const, data: results };
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

      let query = supabase
        .from('stats_valorant_game_player' as any)
        .select(`
          *,
          players!inner(id, ign, photo_url, team_id,
            schools_teams(id, name, logo_url)
          ),
          games!inner(id, match_id,
            matches(stage_id,
              esports_seasons_stages(season_id)
            )
          )
        `);

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate by player
      const playerMap = new Map<string, ValorantPlayerStats>();
      const rows = (data as any[]) || [];

      for (const row of rows) {
        const playerId = row.player_id;
        const existing = playerMap.get(playerId);

        if (existing) {
          existing.games_played++;
          existing.total_kills += row.kills || 0;
          existing.total_deaths += row.deaths || 0;
          existing.total_assists += row.assists || 0;
          existing.avg_acs += row.acs || 0;
          existing.avg_adr += row.adr || 0;
          existing.avg_hs_percent += row.headshot_percent || 0;
          existing.total_first_bloods += row.first_bloods || 0;
          existing.total_plants += row.plants || 0;
          existing.total_defuses += row.defuses || 0;
          if (row.is_mvp) existing.mvp_count++;
        } else {
          const player = row.players as any;
          const team = player?.schools_teams as any;
          
          playerMap.set(playerId, {
            player_id: playerId,
            player_ign: player?.ign || 'Unknown',
            player_photo_url: player?.photo_url,
            team_id: player?.team_id,
            team_name: team?.name || null,
            team_logo_url: team?.logo_url || null,
            games_played: 1,
            total_kills: row.kills || 0,
            total_deaths: row.deaths || 0,
            total_assists: row.assists || 0,
            kills_per_game: 0,
            deaths_per_game: 0,
            assists_per_game: 0,
            mvp_count: row.is_mvp ? 1 : 0,
            agent_name: row.agent_name,
            avg_acs: row.acs || 0,
            avg_adr: row.adr || 0,
            avg_hs_percent: row.headshot_percent || 0,
            total_first_bloods: row.first_bloods || 0,
            total_plants: row.plants || 0,
            total_defuses: row.defuses || 0
          });
        }
      }

      // Calculate averages
      const results = Array.from(playerMap.values()).map(player => ({
        ...player,
        kills_per_game: player.games_played > 0 ? player.total_kills / player.games_played : 0,
        deaths_per_game: player.games_played > 0 ? player.total_deaths / player.games_played : 0,
        assists_per_game: player.games_played > 0 ? player.total_assists / player.games_played : 0,
        avg_acs: player.games_played > 0 ? player.avg_acs / player.games_played : 0,
        avg_adr: player.games_played > 0 ? player.avg_adr / player.games_played : 0,
        avg_hs_percent: player.games_played > 0 ? player.avg_hs_percent / player.games_played : 0
      }));

      return { success: true as const, data: results };
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
            team_id,
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
   */
  static async getLeaderboard(
    game: 'mlbb' | 'valorant',
    metric: string,
    limit: number = 5
  ): Promise<{ success: boolean; data?: LeaderboardEntry[]; error?: string }> {
    try {
      const stats = game === 'mlbb' 
        ? await this.getMlbbPlayerStats()
        : await this.getValorantPlayerStats();

      if (!stats.success) {
        return { success: false, error: stats.error };
      }

      if (!stats.data) {
        return { success: false, error: 'No data available' };
      }

      // Sort by metric and take top N
      const sorted = [...stats.data].sort((a, b) => {
        const aVal = (a as any)[metric] || 0;
        const bVal = (b as any)[metric] || 0;
        return bVal - aVal;
      }).slice(0, limit);

      const leaderboard: LeaderboardEntry[] = sorted.map(player => ({
        player_id: player.player_id,
        player_ign: player.player_ign,
        player_photo_url: player.player_photo_url,
        team_name: player.team_name,
        team_logo_url: player.team_logo_url,
        value: (player as any)[metric] || 0,
        metric_name: metric
      }));

      return { success: true, data: leaderboard };
    } catch (error) {
      return this.formatError<LeaderboardEntry[]>(error, 'Failed to fetch leaderboard');
    }
  }
}

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

  /**
   * Get aggregated hero statistics for MLBB
   */
  static async getHeroStats(
    seasonId?: number,
    stageId?: number
  ) {
    try {
      const supabase = await this.getClient();

      let query = supabase
        .from('stats_mlbb_game_player' as any)
        .select(`
          hero_name,
          kills,
          deaths,
          assists,
          gold,
          damage_dealt,
          damage_taken,
          turret_damage,
          games!inner(
            id,
            winner_team_id,
            matches!inner(
              stage_id,
              esports_seasons_stages(season_id)
            )
          )
        `);

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate by hero
      const heroMap = new Map<string, {
        hero_name: string;
        games_played: number;
        wins: number;
        total_kills: number;
        total_deaths: number;
        total_assists: number;
        total_gold: number;
        total_damage_dealt: number;
        total_damage_taken: number;
        total_turret_damage: number;
      }>();

      const rows = (data as any[]) || [];
      let totalGames = 0;

      // Get unique games for total count
      const uniqueGames = new Set(rows.map(r => r.games?.id));
      totalGames = uniqueGames.size;

      for (const row of rows) {
        const heroName = row.hero_name || 'Unknown';
        const existing = heroMap.get(heroName);

        // Check if this player won (their team_id matches winner_team_id)
        const isWin = false; // Simplified - would need team_id comparison

        if (existing) {
          existing.games_played++;
          existing.total_kills += row.kills || 0;
          existing.total_deaths += row.deaths || 0;
          existing.total_assists += row.assists || 0;
          existing.total_gold += row.gold || 0;
          existing.total_damage_dealt += row.damage_dealt || 0;
          existing.total_damage_taken += row.damage_taken || 0;
          existing.total_turret_damage += row.turret_damage || 0;
        } else {
          heroMap.set(heroName, {
            hero_name: heroName,
            games_played: 1,
            wins: 0,
            total_kills: row.kills || 0,
            total_deaths: row.deaths || 0,
            total_assists: row.assists || 0,
            total_gold: row.gold || 0,
            total_damage_dealt: row.damage_dealt || 0,
            total_damage_taken: row.damage_taken || 0,
            total_turret_damage: row.turret_damage || 0,
          });
        }
      }

      // Calculate derived stats
      const results = Array.from(heroMap.values()).map(hero => ({
        hero_name: hero.hero_name,
        icon_url: null, // For future use
        games_played: hero.games_played,
        total_picks: hero.games_played,
        pick_rate: totalGames > 0 ? (hero.games_played / totalGames) * 100 : 0,
        total_wins: hero.wins,
        win_rate: hero.games_played > 0 ? (hero.wins / hero.games_played) * 100 : 0,
        total_kills: hero.total_kills,
        total_deaths: hero.total_deaths,
        total_assists: hero.total_assists,
        avg_kills: hero.games_played > 0 ? hero.total_kills / hero.games_played : 0,
        avg_deaths: hero.games_played > 0 ? hero.total_deaths / hero.games_played : 0,
        avg_assists: hero.games_played > 0 ? hero.total_assists / hero.games_played : 0,
        avg_kda: hero.total_deaths > 0
          ? (hero.total_kills + hero.total_assists) / hero.total_deaths
          : hero.total_kills + hero.total_assists,
        avg_gold: hero.games_played > 0 ? hero.total_gold / hero.games_played : 0,
        avg_damage_dealt: hero.games_played > 0 ? hero.total_damage_dealt / hero.games_played : 0,
        avg_damage_taken: hero.games_played > 0 ? hero.total_damage_taken / hero.games_played : 0,
        avg_turret_damage: hero.games_played > 0 ? hero.total_turret_damage / hero.games_played : 0,
      }));

      // Sort by pick rate
      results.sort((a, b) => b.pick_rate - a.pick_rate);

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
    stageId?: number
  ) {
    try {
      const supabase = await this.getClient();

      let query = supabase
        .from('stats_valorant_game_player' as any)
        .select(`
          agent_name,
          kills,
          deaths,
          assists,
          acs,
          first_bloods,
          games!inner(
            id,
            winner_team_id,
            matches!inner(
              stage_id,
              esports_seasons_stages(season_id)
            )
          )
        `);

      const { data, error } = await query;

      if (error) throw error;

      // Agent role mapping
      const agentRoles: Record<string, string> = {
        'Jett': 'duelist', 'Phoenix': 'duelist', 'Reyna': 'duelist', 'Raze': 'duelist',
        'Yoru': 'duelist', 'Neon': 'duelist', 'Iso': 'duelist',
        'Breach': 'initiator', 'Skye': 'initiator', 'Sova': 'initiator',
        'KAY/O': 'initiator', 'Fade': 'initiator', 'Gekko': 'initiator',
        'Brimstone': 'controller', 'Omen': 'controller', 'Viper': 'controller',
        'Astra': 'controller', 'Harbor': 'controller', 'Clove': 'controller',
        'Killjoy': 'sentinel', 'Cypher': 'sentinel', 'Sage': 'sentinel',
        'Chamber': 'sentinel', 'Deadlock': 'sentinel', 'Vyse': 'sentinel',
      };

      // Aggregate by agent
      const agentMap = new Map<string, {
        agent_name: string;
        games_played: number;
        wins: number;
        total_kills: number;
        total_deaths: number;
        total_assists: number;
        total_acs: number;
        total_first_bloods: number;
      }>();

      const rows = (data as any[]) || [];
      const uniqueGames = new Set(rows.map(r => r.games?.id));
      const totalGames = uniqueGames.size;

      for (const row of rows) {
        const agentName = row.agent_name || 'Unknown';
        const existing = agentMap.get(agentName);

        if (existing) {
          existing.games_played++;
          existing.total_kills += row.kills || 0;
          existing.total_deaths += row.deaths || 0;
          existing.total_assists += row.assists || 0;
          existing.total_acs += row.acs || 0;
          existing.total_first_bloods += row.first_bloods || 0;
        } else {
          agentMap.set(agentName, {
            agent_name: agentName,
            games_played: 1,
            wins: 0,
            total_kills: row.kills || 0,
            total_deaths: row.deaths || 0,
            total_assists: row.assists || 0,
            total_acs: row.acs || 0,
            total_first_bloods: row.first_bloods || 0,
          });
        }
      }

      // Calculate derived stats
      const results = Array.from(agentMap.values()).map(agent => ({
        agent_name: agent.agent_name,
        icon_url: null, // For future use
        role: agentRoles[agent.agent_name] || null,
        games_played: agent.games_played,
        total_picks: agent.games_played,
        pick_rate: totalGames > 0 ? (agent.games_played / totalGames) * 100 : 0,
        total_wins: agent.wins,
        win_rate: agent.games_played > 0 ? (agent.wins / agent.games_played) * 100 : 0,
        total_kills: agent.total_kills,
        total_deaths: agent.total_deaths,
        total_assists: agent.total_assists,
        avg_kills: agent.games_played > 0 ? agent.total_kills / agent.games_played : 0,
        avg_deaths: agent.games_played > 0 ? agent.total_deaths / agent.games_played : 0,
        avg_assists: agent.games_played > 0 ? agent.total_assists / agent.games_played : 0,
        avg_kda: agent.total_deaths > 0
          ? (agent.total_kills + agent.total_assists) / agent.total_deaths
          : agent.total_kills + agent.total_assists,
        avg_acs: agent.games_played > 0 ? agent.total_acs / agent.games_played : 0,
        total_first_bloods: agent.total_first_bloods,
        avg_first_bloods: agent.games_played > 0 ? agent.total_first_bloods / agent.games_played : 0,
      }));

      // Sort by pick rate
      results.sort((a, b) => b.pick_rate - a.pick_rate);

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
    stageId?: number
  ) {
    try {
      const supabase = await this.getClient();

      // Get map vetoes data
      const { data: vetoData, error: vetoError } = await supabase
        .from('valorant_map_vetoes')
        .select(`
          map_name,
          action,
          matches!inner(
            id,
            stage_id,
            esports_seasons_stages(season_id)
          )
        `);

      if (vetoError) throw vetoError;

      // Get map metadata
      const { data: mapsData, error: mapsError } = await supabase
        .from('valorant_maps')
        .select('*')
        .eq('is_active', true);

      if (mapsError) throw mapsError;

      // Build map info lookup
      const mapInfo = new Map<string, { id: number; splash_image_url: string | null }>();
      for (const map of mapsData || []) {
        mapInfo.set(map.name, { id: map.id, splash_image_url: map.splash_image_url });
      }

      // Aggregate by map
      const mapStats = new Map<string, {
        map_name: string;
        picks: number;
        bans: number;
        total_matches: number;
      }>();

      const rows = (vetoData as any[]) || [];
      const uniqueMatches = new Set(rows.map(r => r.matches?.id));
      const totalMatches = uniqueMatches.size;

      for (const row of rows) {
        const mapName = row.map_name || 'Unknown';
        const existing = mapStats.get(mapName);

        if (existing) {
          if (row.action === 'pick') existing.picks++;
          if (row.action === 'ban') existing.bans++;
          existing.total_matches++;
        } else {
          mapStats.set(mapName, {
            map_name: mapName,
            picks: row.action === 'pick' ? 1 : 0,
            bans: row.action === 'ban' ? 1 : 0,
            total_matches: 1,
          });
        }
      }

      // Calculate derived stats
      const results = Array.from(mapStats.values()).map(map => {
        const info = mapInfo.get(map.map_name);
        return {
          map_id: info?.id || 0,
          map_name: map.map_name,
          splash_image_url: info?.splash_image_url || null,
          total_games: map.picks,
          total_picks: map.picks,
          pick_rate: totalMatches > 0 ? (map.picks / totalMatches) * 100 : 0,
          total_bans: map.bans,
          ban_rate: totalMatches > 0 ? (map.bans / totalMatches) * 100 : 0,
          attack_wins: 0, // Would need game-level data
          defense_wins: 0,
          attack_win_rate: 50, // Placeholder
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
    stageId?: number
  ) {
    try {
      const supabase = await this.getClient();

      const tableName = game === 'mlbb' ? 'stats_mlbb_game_player' : 'stats_valorant_game_player';

      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          team_id,
          kills,
          deaths,
          assists,
          ${game === 'mlbb' ? 'gold, damage_dealt,' : 'acs, first_bloods,'}
          schools_teams!inner(
            id,
            name,
            school:schools(
              id,
              name,
              abbreviation,
              logo_url
            )
          ),
          games!inner(
            id,
            winner_team_id,
            matches!inner(
              stage_id,
              esports_seasons_stages(season_id)
            )
          )
        `);

      if (error) throw error;

      // Aggregate by team
      const teamMap = new Map<string, {
        team_id: string;
        team_name: string;
        school_name: string;
        school_abbreviation: string;
        school_logo_url: string | null;
        games_played: number;
        wins: number;
        total_kills: number;
        total_deaths: number;
        total_assists: number;
        total_gold?: number;
        total_damage?: number;
        total_acs?: number;
        total_first_bloods?: number;
        gameIds: Set<number>;
      }>();

      const rows = (data as any[]) || [];

      for (const row of rows) {
        const teamId = row.team_id;
        if (!teamId) continue;

        const team = row.schools_teams as any;
        const school = team?.school as any;
        const gameId = row.games?.id;
        const isWin = row.team_id === row.games?.winner_team_id;

        const existing = teamMap.get(teamId);

        if (existing) {
          existing.total_kills += row.kills || 0;
          existing.total_deaths += row.deaths || 0;
          existing.total_assists += row.assists || 0;
          if (game === 'mlbb') {
            existing.total_gold = (existing.total_gold || 0) + (row.gold || 0);
            existing.total_damage = (existing.total_damage || 0) + (row.damage_dealt || 0);
          } else {
            existing.total_acs = (existing.total_acs || 0) + (row.acs || 0);
            existing.total_first_bloods = (existing.total_first_bloods || 0) + (row.first_bloods || 0);
          }
          if (gameId && !existing.gameIds.has(gameId)) {
            existing.gameIds.add(gameId);
            existing.games_played++;
            if (isWin) existing.wins++;
          }
        } else {
          const newEntry: any = {
            team_id: teamId,
            team_name: team?.name || 'Unknown',
            school_name: school?.name || 'Unknown',
            school_abbreviation: school?.abbreviation || '',
            school_logo_url: school?.logo_url || null,
            games_played: 1,
            wins: isWin ? 1 : 0,
            total_kills: row.kills || 0,
            total_deaths: row.deaths || 0,
            total_assists: row.assists || 0,
            gameIds: new Set([gameId]),
          };
          if (game === 'mlbb') {
            newEntry.total_gold = row.gold || 0;
            newEntry.total_damage = row.damage_dealt || 0;
          } else {
            newEntry.total_acs = row.acs || 0;
            newEntry.total_first_bloods = row.first_bloods || 0;
          }
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
        avg_gold_per_game: team.total_gold && team.games_played > 0 ? team.total_gold / team.games_played : undefined,
        avg_damage_per_game: team.total_damage && team.games_played > 0 ? team.total_damage / team.games_played : undefined,
        avg_acs: team.total_acs && team.games_played > 0 ? team.total_acs / team.games_played : undefined,
        total_first_bloods: team.total_first_bloods,
      }));

      // Sort by win rate
      results.sort((a, b) => b.win_rate - a.win_rate);

      return { success: true as const, data: results };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch team stats');
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
        .select('id, start_at, end_at')
        .order('start_at', { ascending: false });

      if (error) throw error;

      const options = (data || []).map((season: any) => {
        const year = new Date(season.start_at).getFullYear();
        return {
          id: season.id,
          label: `Season ${season.id} (${year})`,
          value: season.id,
        };
      });

      return { success: true as const, data: options };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch seasons');
    }
  }

  /**
   * Get available stages for a season
   */
  static async getStagesBySeason(seasonId: number) {
    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase
        .from('esports_seasons_stages')
        .select(`
          id,
          competition_stage,
          esports_categories(
            id,
            division,
            levels,
            esports(id, name)
          )
        `)
        .eq('season_id', seasonId);

      if (error) throw error;

      const options = (data || []).map((stage: any) => ({
        id: stage.id,
        label: `${stage.esports_categories?.esports?.name || ''} - ${stage.competition_stage}`,
        value: stage.id,
        category: stage.esports_categories,
      }));

      return { success: true as const, data: options };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch stages');
    }
  }
}


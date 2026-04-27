'use server';

import { StatisticsService, StatisticsFilters } from '../services/statistics';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function getMlbbStats(filters?: Partial<StatisticsFilters>) {
  return StatisticsService.getMlbbPlayerStats(filters);
}

export async function getValorantStats(filters?: Partial<StatisticsFilters>) {
  return StatisticsService.getValorantPlayerStats(filters);
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_KEY = '__leaderboardCache_v5' as const;
const globalForCache = globalThis as unknown as {
    [CACHE_KEY]: Record<string, CacheEntry>;
};

if (!globalForCache[CACHE_KEY]) {
    globalForCache[CACHE_KEY] = {};
}

// 5 Days in milliseconds
const TTL_5_DAYS = 5 * 24 * 60 * 60 * 1000;

export async function getLeaderboard(
  game: 'mlbb' | 'valorant',
  metric: string,
  limit: number = 5,
  seasonId?: number,
  division?: string,
  minGames?: number
) {
  const cacheKey = `${game}-${metric}-${limit}-${seasonId || 'all'}-${division || 'all'}-${minGames || 0}`;
  
  const cached = globalForCache[CACHE_KEY][cacheKey];
  if (cached && (Date.now() - cached.timestamp < TTL_5_DAYS)) {
      return cached.data;
  }

  const result = await StatisticsService.getLeaderboard(game, metric, limit, seasonId, division, minGames);
  
  if (result.success) {
      globalForCache[CACHE_KEY][cacheKey] = {
          data: result,
          timestamp: Date.now()
      };
  }

  return result;
}

export async function getRoleMastery(
  game: 'mlbb' | 'valorant',
  role: string,
  limit: number = 10,
  seasonId?: number,
  division?: string,
  minGames: number = 3
) {
  const cacheKey = `role-mastery-${game}-${role}-${limit}-${seasonId || 'all'}-${division || 'all'}-${minGames}`;
  
  const cached = globalForCache[CACHE_KEY][cacheKey];
  if (cached && (Date.now() - cached.timestamp < TTL_5_DAYS)) {
      return cached.data;
  }

  const result = await StatisticsService.getRoleMasteryLeaderboard(game, role, limit, seasonId, division, minGames);

  if (result.success) {
      globalForCache[CACHE_KEY][cacheKey] = {
          data: result,
          timestamp: Date.now()
      };
  }

  return result;
}

// Hero/Agent/Map/Team Statistics Actions

export async function getHeroStats(seasonId?: number, stageId?: number, division?: string, schoolId?: string, teamId?: string) {
  return StatisticsService.getHeroStats(seasonId, stageId, division, schoolId, teamId);
}

export async function getAgentStats(seasonId?: number, stageId?: number, division?: string, schoolId?: string, teamId?: string) {
  return StatisticsService.getAgentStats(seasonId, stageId, division, schoolId, teamId);
}

export async function getMapStats(seasonId?: number, stageId?: number, schoolId?: string, teamId?: string) {
  return StatisticsService.getMapStats(seasonId, stageId, schoolId, teamId);
}

export async function getTeamStats(
  game: 'mlbb' | 'valorant',
  seasonId?: number,
  stageId?: number,
  division?: string
) {
  return StatisticsService.getTeamStats(game, seasonId, stageId, division);
}

// Filter Data Actions

export async function getAvailableSeasons() {
  return StatisticsService.getAvailableSeasons();
}

export async function getAvailableCategories(esportId?: number) {
  return StatisticsService.getAvailableCategories(esportId);
}

export async function getStagesBySeason(seasonId: number, division?: string) {
  return StatisticsService.getStagesBySeason(seasonId, division);
}

export async function getPlayerCharacterStats(playerId: string, game: 'mlbb' | 'valorant') {
  return StatisticsService.getPlayerCharacterStats(playerId, game);
}

// Esports (Games) Data Action

export interface EsportGame {
  id: number;
  name: string;
  abbreviation: string | null;
  logo_url: string | null;
}

export async function getEsports(): Promise<{ success: boolean; data?: EsportGame[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('esports')
      .select('id, name, abbreviation, logo_url')
      .order('name');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Failed to fetch esports:', error);
    return { success: false, error: 'Failed to fetch esports' };
  }
}

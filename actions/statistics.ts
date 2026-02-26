'use server';

import { StatisticsService, StatisticsFilters } from '../services/statistics';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function getMlbbStats(filters?: Partial<StatisticsFilters>) {
  return StatisticsService.getMlbbPlayerStats(filters);
}

export async function getValorantStats(filters?: Partial<StatisticsFilters>) {
  return StatisticsService.getValorantPlayerStats(filters);
}

export async function getLeaderboard(
  game: 'mlbb' | 'valorant',
  metric: string,
  limit: number = 5,
  seasonId?: number
) {
  return StatisticsService.getLeaderboard(game, metric, limit, seasonId);
}

// Hero/Agent/Map/Team Statistics Actions

export async function getHeroStats(seasonId?: number, stageId?: number, categoryId?: number) {
  return StatisticsService.getHeroStats(seasonId, stageId, categoryId);
}

export async function getAgentStats(seasonId?: number, stageId?: number, categoryId?: number) {
  return StatisticsService.getAgentStats(seasonId, stageId, categoryId);
}

export async function getMapStats(seasonId?: number, stageId?: number) {
  return StatisticsService.getMapStats(seasonId, stageId);
}

export async function getTeamStats(
  game: 'mlbb' | 'valorant',
  seasonId?: number,
  stageId?: number,
  categoryId?: number
) {
  return StatisticsService.getTeamStats(game, seasonId, stageId, categoryId);
}

// Filter Data Actions

export async function getAvailableSeasons() {
  return StatisticsService.getAvailableSeasons();
}

export async function getAvailableCategories() {
  return StatisticsService.getAvailableCategories();
}

export async function getStagesBySeason(seasonId: number) {
  return StatisticsService.getStagesBySeason(seasonId);
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

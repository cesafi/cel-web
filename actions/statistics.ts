'use server';

import { StatisticsService, StatisticsFilters } from '../services/statistics';

export async function getMlbbStats(filters?: Partial<StatisticsFilters>) {
  return StatisticsService.getMlbbPlayerStats(filters);
}

export async function getValorantStats(filters?: Partial<StatisticsFilters>) {
  return StatisticsService.getValorantPlayerStats(filters);
}

export async function getLeaderboard(
  game: 'mlbb' | 'valorant',
  metric: string,
  limit: number = 5
) {
  return StatisticsService.getLeaderboard(game, metric, limit);
}

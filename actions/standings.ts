'use server';

import { StandingsService } from '@/services/standings';
import { StandingsFilters } from '@/lib/types/standings';

export async function getStandings(filters: StandingsFilters) {
  return await StandingsService.getStandings(filters);
}

export async function getStandingsNavigation(filters: StandingsFilters) {
  return await StandingsService.getStandingsNavigation(filters);
}

export async function getGroupStageStandings(stageId: number) {
  return await StandingsService.getGroupStageStandings(stageId);
}

export async function getBracketStandings(stageId: number) {
  return await StandingsService.getBracketStandings(stageId);
}

export async function getAvailableSeasons() {
  return await StandingsService.getAvailableSeasons();
}

export async function getAvailableSports(seasonId: number) {
  return await StandingsService.getAvailableSports(seasonId);
}

export async function getAvailableCategories(seasonId: number, sportId: number) {
  return await StandingsService.getAvailableCategories(seasonId, sportId);
}

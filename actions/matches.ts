'use server';

import { MatchesService } from '@/services/matches';
import { SchedulePaginationOptions, ScheduleFilters } from '@/lib/types/matches';

export async function getMatchById(id: number) {
  return MatchesService.getMatchById(id);
}

export async function getUpcomingMatches(limit?: number) {
  return MatchesService.getUpcomingMatches(limit);
}

export const getUpcomingMatchesWithDetails = getUpcomingMatches;

export async function getScheduleMatches(options?: SchedulePaginationOptions) {
  return MatchesService.getScheduleMatches(options);
}

export async function getScheduleMatchesByDate(filters?: ScheduleFilters) {
  return MatchesService.getScheduleMatchesByDate(filters);
}

export async function getScheduleMatchesWithCategories(options?: SchedulePaginationOptions) {
  return MatchesService.getScheduleMatchesWithCategories(options);
}

export async function getMatchDeletionPreview(matchId: number) {
  // This would need a real implementation if used
  return { success: true as const, data: { gamesCount: 0, gameScoresCount: 0, participantsCount: 0 } };
}

export async function getAvailableSportCategories() {
  return MatchesService.getAvailableSportCategories();
}

export async function updateMatchById(data: Parameters<typeof MatchesService.updateMatchById>[0]) {
  return MatchesService.updateMatchById(data);
}


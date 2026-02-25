'use server';

import { revalidatePath } from 'next/cache';
import { MatchesService } from '@/services/matches';
import { SeasonService } from '@/services/seasons';
import { EsportsSeasonsStagesService } from '@/services/esports-seasons-stages';
import { SchedulePaginationOptions, ScheduleFilters, MatchInsert, MatchUpdate, Match } from '@/lib/types/matches';
import { ServiceResponse } from '@/lib/types/base';

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

export async function getScheduleMatchesAroundDate(options?: {
  totalLimit?: number;
  referenceDate?: string;
  filters?: ScheduleFilters;
}) {
  return MatchesService.getScheduleMatchesAroundDate(options);
}

export async function getMatchDeletionPreview(matchId: number): Promise<{ success: true; data: { gamesCount: number; gameScoresCount: number; participantsCount: number }; error?: undefined } | { success: false; error: string }> {
  // This would need a real implementation if used
  // For now, return placeholder data
  void matchId; // Unused parameter
  return { success: true, data: { gamesCount: 0, gameScoresCount: 0, participantsCount: 0 } };
}

export async function getAvailableSportCategories() {
  return MatchesService.getAvailableSportCategories();
}

export async function updateMatchById(data: MatchUpdate & { id: number }, participantTeamIds?: string[]) {
  const result = await MatchesService.updateMatchById(data, participantTeamIds);
  if (result.success) revalidatePath('/admin/matches');
  return result;
}

export async function getMatchesByStageId(stageId: number, options?: { page?: number; pageSize?: number }) {
  return MatchesService.getMatchesByStageId(stageId, options);
}

export async function createMatch(matchData: MatchInsert, participantTeamIds?: string[]) {
  const result = await MatchesService.createMatch(matchData, participantTeamIds);
  if (result.success) revalidatePath('/admin/matches');
  return result;
}

export async function deleteMatchById(id: number) {
  const result = await MatchesService.deleteMatchById(id);
  if (result.success) revalidatePath('/admin/matches');
  return result;
}

export async function getAvailableSeasons() {
  return SeasonService.getAll();
}


export async function getAvailableStages() {
  return EsportsSeasonsStagesService.getAll();
}

/**
 * Perform a dynamic coin toss for a match to determine Map Veto execution advantages.
 */
export async function performMatchCoinToss(matchId: number, team1Id: string, team2Id: string): Promise<ServiceResponse<Match>> {
  try {
    const isTeam1 = Math.random() > 0.5;
    const isHeads = Math.random() > 0.5;
    
    const winnerId = isTeam1 ? team1Id : team2Id;
    const result = isHeads ? 'heads' : 'tails';
    
    const update = await MatchesService.updateMatchById({
      id: matchId,
      coin_toss_winner_id: winnerId,
      coin_toss_result: result,
    });
    
    if (update.success) {
      revalidatePath(`/admin/matches/${matchId}`);
      revalidatePath(`/veto/${matchId}`);
    }
    
    return update;
  } catch (error) {
    console.error('Match coin toss failed:', error);
    return { success: false, error: 'Coin toss execution failed' };
  }
}

export async function resetMatchCoinToss(matchId: number): Promise<ServiceResponse<Match>> {
  try {
    const update = await MatchesService.updateMatchById({
      id: matchId,
      coin_toss_winner_id: null,
      coin_toss_result: null,
    });
    
    if (update.success) {
      revalidatePath(`/admin/matches/${matchId}`);
      revalidatePath(`/veto/${matchId}`);
    }
    
    return update;
  } catch (error) {
    console.error('Match coin toss reset failed:', error);
    return { success: false, error: 'Coin toss reset failed' };
  }
}

export async function switchMatchCoinTossWinner(matchId: number, currentWinnerId: string, team1Id: string, team2Id: string): Promise<ServiceResponse<Match>> {
  try {
    const newWinnerId = currentWinnerId === team1Id ? team2Id : team1Id;
    const update = await MatchesService.updateMatchById({
      id: matchId,
      coin_toss_winner_id: newWinnerId,
    });
    
    if (update.success) {
      revalidatePath(`/admin/matches/${matchId}`);
      revalidatePath(`/veto/${matchId}`);
    }
    
    return update;
  } catch (error) {
    console.error('Match coin toss switch failed:', error);
    return { success: false, error: 'Coin toss switch failed' };
  }
}

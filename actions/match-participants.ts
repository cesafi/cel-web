'use server';

import { MatchParticipantService } from '@/services/match-participants';
import { createMatchParticipantSchema, updateMatchParticipantSchema } from '@/lib/validations/match-participants';
import { ServiceResponse } from '@/lib/types/base';
import { MatchParticipant } from '@/lib/types/match-participants';
import { RevalidationHelper } from '@/lib/utils/revalidation';
import { revalidatePath } from 'next/cache';

// Core context-based fetching actions
export async function getMatchParticipantsByMatchId(matchId: number) {
  return await MatchParticipantService.getByMatchId(matchId);
}

export async function getMatchParticipantsByTeamId(teamId: string) {
  return await MatchParticipantService.getByTeamId(teamId);
}

export async function getMatchParticipantByMatchAndTeam(matchId: number, teamId: string) {
  return await MatchParticipantService.getByMatchAndTeam(matchId, teamId);
}

// CRUD operations
export async function createMatchParticipant(data: unknown): Promise<ServiceResponse<MatchParticipant>> {
  // Validate the input data
  const validationResult = createMatchParticipantSchema.safeParse(data);
  
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const result = await MatchParticipantService.insert(validationResult.data);

  if (result.success) {
    RevalidationHelper.revalidateMatchParticipants();
  }

  return result;
}

export async function updateMatchParticipantById(data: unknown): Promise<ServiceResponse<MatchParticipant>> {
  // Validate the input data
  const validationResult = updateMatchParticipantSchema.safeParse(data);
  
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const result = await MatchParticipantService.updateById(validationResult.data);

  if (result.success) {
    RevalidationHelper.revalidateMatchParticipants();
  }

  return result;
}

export async function deleteMatchParticipantById(id: number) {
  const result = await MatchParticipantService.deleteById(id);

  if (result.success) {
    RevalidationHelper.revalidateMatchParticipants();
  }

  return result;
}

// Utility actions for specific business logic
export async function getMatchParticipantsWithDetails(matchId: number) {
  return await MatchParticipantService.getMatchParticipantsWithDetails(matchId);
}

export async function getTeamMatchHistory(teamId: string) {
  return await MatchParticipantService.getTeamMatchHistory(teamId);
}

export async function updateMatchScores(
  scoreUpdates: Array<{ match_id: number; team_id: string; match_score: number | null }>
) {
  const result = await MatchParticipantService.updateMatchScores(scoreUpdates);

  if (result.success) {
    RevalidationHelper.revalidateMatchParticipants();
    // Also revalidate specific match detail pages
    if (scoreUpdates.length > 0) {
      const matchId = scoreUpdates[0].match_id;
      revalidatePath(`/admin/matches/${matchId}`);
    }
  }

  return result;
}

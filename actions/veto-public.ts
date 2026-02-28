'use server';

import { MatchesService } from '@/services/matches';
import { ValorantMapVetoService } from '@/services/valorant-map-vetoes';
import { getVetoSequence, getCurrentVetoStep, VetoAction } from '@/lib/types/map-veto';
import { revalidatePath } from 'next/cache';

/**
 * Validates public veto access using matchId and teamId
 */
export async function validatePublicVetoAccess(matchId: number, teamId: string) {
  try {
    const result = await MatchesService.getMatchById(matchId);

    if (!result.success || !result.data) {
      return { success: false, error: 'Match not found' };
    }

    const match = result.data;

    // Check if the provided teamId is actually part of this match
    let teamSide: 'team1' | 'team2' | undefined;

    if (match.match_participants?.[0]?.team_id === teamId) {
      teamSide = 'team1';
    } else if (match.match_participants?.[1]?.team_id === teamId) {
      teamSide = 'team2';
    }

    if (!teamSide) {
      return { success: false, error: 'Team is not a participant in this match' };
    }

    return {
      success: true as const,
      data: {
        match,
        teamId,
        teamSide
      }
    };
  } catch (error) {
    return { success: false, error: 'Failed to validate match access' };
  }
}

/**
 * Performs a veto action (ban/pick) using public access parameters
 */
export async function performPublicVeto(
  matchId: number,
  teamId: string,
  mapName: string,
  action: VetoAction,
  sequenceOrder: number
) {
  try {
    // 1. Validate Access
    const result = await validatePublicVetoAccess(matchId, teamId);

    if (!result.success) {
      const errorMsg = (result as any).error;
      return { success: false, error: errorMsg || 'Invalid access' };
    }

    const successData = (result as any).data;
    if (!successData) {
      return { success: false, error: 'Match data not found' };
    }

    const { match, teamSide } = successData;

    // 2. Validate Turn
    const vetoesResult = await ValorantMapVetoService.getByMatchId(match.id);
    if (!vetoesResult.success || !vetoesResult.data) {
      return { success: false, error: 'Failed to fetch current match state' };
    }

    const vetoes = vetoesResult.data;

    // Check if map already vetoed
    if (vetoes.some(v => v.map_name === mapName)) {
      return { success: false, error: 'Map has already been selected' };
    }

    const bestOf = match.best_of || 3;
    const currentStep = getCurrentVetoStep(vetoes, bestOf);

    if (!currentStep) {
      return { success: false, error: 'Veto process is already complete' };
    }

    // Verify it's the correct step
    if (currentStep.stepNumber !== sequenceOrder) {
      return { success: false, error: 'Out of sync sequence order' };
    }

    // Verify it's this team's turn
    if (currentStep.team !== teamSide) {
      return { success: false, error: `It is not your turn. Waiting for ${currentStep.team === 'team1' ? 'Team 1' : 'Team 2'}.` };
    }

    // Verify action matches
    if (currentStep.action !== action) {
      return { success: false, error: `Expected action '${currentStep.action}' but received '${action}'` };
    }

    // 3. Perform Veto
    const insertResult = await ValorantMapVetoService.insert({
      match_id: match.id,
      map_name: mapName,
      team_id: teamId,
      action: action,
      sequence_order: currentStep.stepNumber,
    });

    if (!insertResult.success) {
      return { success: false, error: insertResult.error || 'Failed to record veto' };
    }

    revalidatePath(`/veto/${matchId}`); // Revalidate public page
    revalidatePath(`/admin/matches/${match.id}`); // Revalidate admin page

    return { success: true };

  } catch (error) {
    console.error('Public Veto Error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Performs side selection using public access parameters
 */
export async function selectPublicVetoSide(
  matchId: number,
  teamId: string,
  vetoId: string,
  side: 'attack' | 'defense'
) {
  try {
    // 1. Validate Access
    const result = await validatePublicVetoAccess(matchId, teamId);

    if (!result.success) {
      const errorMsg = (result as any).error;
      return { success: false, error: errorMsg || 'Invalid access' };
    }

    const successData = (result as any).data;
    if (!successData) {
      return { success: false, error: 'Match data not found' };
    }

    const { match } = successData;

    // 2. Fetch Veto
    const vetoesResult = await ValorantMapVetoService.getByMatchId(match.id);
    if (!vetoesResult.success || !vetoesResult.data) {
      return { success: false, error: 'Failed to fetch current match state' };
    }

    const vetoes = vetoesResult.data;
    const veto = vetoes.find(v => v.id === vetoId);

    if (!veto) {
      return { success: false, error: 'Veto not found' };
    }

    // 3. Update Veto
    const updateResult = await ValorantMapVetoService.updateById({
      id: vetoId,
      side_selected: side
    });

    if (!updateResult.success) {
      return { success: false, error: updateResult.error || 'Failed to select side' };
    }

    revalidatePath(`/veto/${matchId}`);
    revalidatePath(`/admin/matches/${match.id}`);

    return { success: true };

  } catch (error) {
    console.error('Public Side Selection Error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

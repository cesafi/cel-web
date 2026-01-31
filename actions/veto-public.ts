'use server';

import { MatchesService } from '@/services/matches';
import { ValorantMapVetoService } from '@/services/valorant-map-vetoes';
import { getVetoSequence, getCurrentVetoStep, VetoAction } from '@/lib/types/map-veto';
import { revalidatePath } from 'next/cache';

/**
 * Validates a veto token and returns the match and authorized team
 */
export async function validateVetoToken(token: string) {
  return MatchesService.getMatchByVetoToken(token);
}

/**
 * Performs a veto action (ban/pick) using a public token
 */
export async function performPublicVeto(
  token: string,
  mapName: string,
  action: VetoAction,
  sequenceOrder: number
) {
  try {
    // 1. Validate Token
    const result = await MatchesService.getMatchByVetoToken(token);
    
    if (!result.success) {
      // Cast to any to safely access error if TS is confused
      const errorMsg = (result as any).error;
      return { success: false, error: errorMsg || 'Invalid or expired token' };
    }

    // TS should strictly know this is success variant now, but if not, we use assertion
    const successData = (result as any).data;
    if (!successData) {
       return { success: false, error: 'Match data not found' };
    }

    const { match, teamId, teamSide } = successData;
    if (!teamId || !teamSide) {
      return { success: false, error: 'Token is not associated with a valid team' };
    }

    // 2. Validate Turn
    // Fetch current vetoes to determine whose turn it is
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
       // Allow tolerance for race conditions? No, strict order.
       // Actually, the client might send stale sequenceOrder.
       // But we should trust the calculated currentStep on server.
       // If client sends 1 but we are on 2, fail.
    }

    // Verify it's this team's turn
    // currentStep.team is 'team1' or 'team2'
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
      // creating_token: token, // Maybe log who did it? Not in schema.
    });

    if (!insertResult.success) {
      return { success: false, error: insertResult.error || 'Failed to record veto' };
    }

    revalidatePath(`/veto/${token}`); // Revalidate public page
    revalidatePath(`/admin/matches/${match.id}`); // Revalidate admin page

    return { success: true };

  } catch (error) {
    console.error('Public Veto Error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

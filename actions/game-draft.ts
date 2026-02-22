'use server';

import { ServiceResponse } from '@/lib/types/base';
import { GameDraftService } from '@/services/game-draft';
import { insertGameDraftActionSchema } from '@/lib/validations/game-draft';
import { GameDraftAction } from '@/lib/types/game-draft';

export async function getGameDraftActionsByGameId(gameId: number): Promise<ServiceResponse<GameDraftAction[]>> {
  return await GameDraftService.getByGameId(gameId);
}

export async function submitGameDraftAction(data: unknown): Promise<ServiceResponse<undefined>> {
  const validationResult = insertGameDraftActionSchema.safeParse(data);
  
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  return await GameDraftService.insert(validationResult.data);
}

export async function resetGameDraft(gameId: number): Promise<ServiceResponse<undefined>> {
  return await GameDraftService.resetDraft(gameId);
}

export async function undoLastGameDraftAction(gameId: number): Promise<ServiceResponse<undefined>> {
  return await GameDraftService.undoLastAction(gameId);
}

export async function lockGameDraftAction(actionId: string): Promise<ServiceResponse<undefined>> {
  return await GameDraftService.lockAction(actionId);
}

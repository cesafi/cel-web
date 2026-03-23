'use server';

import { ServiceResponse } from '@/lib/types/base';
import { GameDraftService } from '@/services/game-draft';
import { insertGameDraftActionSchema, updateGameDraftActionSchema } from '@/lib/validations/game-draft';
import { GameDraftAction, GameDraftActionUpdate } from '@/lib/types/game-draft';
import { unstable_noStore as noStore } from 'next/cache';

export async function getGameDraftActionsByGameId(gameId: number): Promise<ServiceResponse<GameDraftAction[]>> {
  noStore();
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

export async function updateGameDraftAction(actionId: string, data: unknown): Promise<ServiceResponse<undefined>> {
  const validationResult = updateGameDraftActionSchema.safeParse(data);
  
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  return await GameDraftService.updateAction(actionId, validationResult.data);
}

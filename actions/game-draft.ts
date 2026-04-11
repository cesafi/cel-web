'use server';

import { ServiceResponse } from '@/lib/types/base';
import { GameDraftService } from '@/services/game-draft';
import { insertGameDraftActionSchema, updateGameDraftActionSchema } from '@/lib/validations/game-draft';
import { GameDraftAction, GameDraftActionUpdate } from '@/lib/types/game-draft';
import { bumpExportCache } from '@/lib/utils/export-cache';

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

  const res = await GameDraftService.insert(validationResult.data);
  if (res.success) bumpExportCache('draft');
  return res;
}

export async function resetGameDraft(gameId: number): Promise<ServiceResponse<undefined>> {
  const res = await GameDraftService.resetDraft(gameId);
  if (res.success) bumpExportCache('draft');
  return res;
}

export async function undoLastGameDraftAction(gameId: number): Promise<ServiceResponse<undefined>> {
  const res = await GameDraftService.undoLastAction(gameId);
  if (res.success) bumpExportCache('draft');
  return res;
}

export async function lockGameDraftAction(actionId: string): Promise<ServiceResponse<undefined>> {
  const res = await GameDraftService.lockAction(actionId);
  if (res.success) bumpExportCache('draft');
  return res;
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

  const res = await GameDraftService.updateAction(actionId, validationResult.data);
  if (res.success) bumpExportCache('draft');
  return res;
}

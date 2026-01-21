'use server';

import { GameScoreService } from '@/services/game-scores';
import { GameScoreInsert, GameScoreUpdate } from '@/lib/types/game-scores';
import { RevalidationHelper } from '@/lib/utils/revalidation';

export async function getGameScoresByGameId(gameId: number) {
  return await GameScoreService.getByGameId(gameId);
}

export async function createGameScore(data: GameScoreInsert) {
  const result = await GameScoreService.insert(data);
  if (result.success) {
    RevalidationHelper.revalidateMatches();
  }
  return result;
}

export async function updateGameScore(data: GameScoreUpdate) {
  const result = await GameScoreService.updateById(data);
  if (result.success) {
    RevalidationHelper.revalidateMatches();
  }
  return result;
}

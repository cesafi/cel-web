'use server';

import { GameScoreService } from '@/services/game-scores';
import { GameScoreInsert, GameScoreUpdate } from '@/lib/types/game-scores';
import { RevalidationHelper } from '@/lib/utils/revalidation';

export async function getGameScoresByGameId(gameId: number) {
  return await GameScoreService.getByGameId(gameId);
}

export async function createGameScore(data: GameScoreInsert) {
  const result = await GameScoreService.insert(data);
  if (result.success && data.game_id) {
    await GameScoreService.syncMatchScoresFromGame(data.game_id);
    RevalidationHelper.revalidateMatches();
  }
  return result;
}

export async function updateGameScore(data: GameScoreUpdate) {
  const result = await GameScoreService.updateById(data);
  if (result.success) {
    let gameId = data.game_id !== null ? data.game_id : undefined;
    if (!gameId && data.id) {
      // Fetch game_id from DB if not in payload
      const gameIdResult = await GameScoreService.getGameIdById(data.id);
      if (gameIdResult.success && gameIdResult.data) {
        gameId = gameIdResult.data;
      }
    }
    
    if (gameId) {
      await GameScoreService.syncMatchScoresFromGame(gameId);
      RevalidationHelper.revalidateMatches();
    }
  }
  return result;
}

export async function upsertGameScoresForGame(gameId: number, scores: GameScoreInsert[]) {
  // Delete existing scores for this game, then bulk insert new ones
  const deleteResult = await GameScoreService.deleteByGameId(gameId);
  if (!deleteResult.success) return deleteResult;

  const insertResult = await GameScoreService.insertMany(scores);
  if (insertResult.success) {
    await GameScoreService.syncMatchScoresFromGame(gameId);
    RevalidationHelper.revalidateMatches();
  }
  return insertResult;
}

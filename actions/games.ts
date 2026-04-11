'use server';

import { revalidatePath } from 'next/cache';
import { PaginationOptions, ServiceResponse } from '@/lib/types/base';
import { GameService } from '@/services/games';
import { createGameSchema, updateGameSchema } from '@/lib/validations/games';
import { Game } from '@/lib/types/games';
import { RevalidationHelper } from '@/lib/utils/revalidation';
import { bumpExportCache } from '@/lib/utils/export-cache';

export async function getPaginatedGames(options: PaginationOptions) {
  return await GameService.getPaginated(options);
}

export async function getAllGames() {
  return await GameService.getAll();
}

export async function getGameById(id: number) {
  return await GameService.getById(id);
}

export async function getGamesByMatchId(matchId: number) {
  return await GameService.getByMatchId(matchId);
}

export async function getPaginatedGamesByMatch(matchId: number, options: PaginationOptions) {
  return await GameService.getPaginatedByMatch(matchId, options);
}

export async function createGame(data: unknown): Promise<ServiceResponse<Game>> {
  // Validate the input data
  const validationResult = createGameSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const result = await GameService.insert(validationResult.data);

  if (result.success) {
    RevalidationHelper.revalidateGames();
  }

  return result;
}

export async function updateGameById(data: unknown): Promise<ServiceResponse<Game>> {
  // Validate the input data
  const validationResult = updateGameSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const result = await GameService.updateById(validationResult.data);

  if (result.success) {
    RevalidationHelper.revalidateGames();
    bumpExportCache('draft');
    bumpExportCache('game-results');
  }

  return result;
}

export async function deleteGameById(id: number) {
  const result = await GameService.deleteById(id);

  if (result.success) {
    RevalidationHelper.revalidateGames();
  }

  return result;
}

/**
 * Delete game with all related game scores
 * This is the recommended way to delete games as it handles score dependencies automatically
 */
export async function deleteGameByIdWithCascade(id: number) {
  const result = await GameService.deleteByIdWithCascade(id);

  if (result.success) {
    RevalidationHelper.revalidateGames();
  }

  return result;
}

export async function calculateMatchDuration(matchId: number) {
  return await GameService.calculateMatchDuration(matchId);
}

/**
 * Perform a dynamic coin toss for a single game (e.g. MLBB Side Selection).
 */
export async function performGameCoinToss(gameId: number, matchId: number, team1Id: string, team2Id: string, headsTeamId?: string) {
  try {
    let winnerId = '';
    if (headsTeamId) {
      const isHeads = Math.random() > 0.5;
      const tailsTeamId = headsTeamId === team1Id ? team2Id : team1Id;
      winnerId = isHeads ? headsTeamId : tailsTeamId;
    } else {
      const isTeam1 = Math.random() > 0.5;
      // For MLBB, "heads/tails" doesn't matter as much, but we could determine First Pick or side
      // Often it just means the winner gets to choose. We will set the winner.
      winnerId = isTeam1 ? team1Id : team2Id;
    }

    const update = await GameService.updateById({
      id: gameId,
      coin_toss_winner: winnerId,
    });

    if (update.success) {
      if (matchId) {
        RevalidationHelper.revalidateMatches();
        revalidatePath(`/broadcast/mlbb/draft/${matchId}`);
      }
      RevalidationHelper.revalidateGames();
      bumpExportCache('draft');
      bumpExportCache('game-results');
    }

    return update;
  } catch (error) {
    console.error('Game coin toss failed:', error);
    return { success: false, error: 'Coin toss execution failed' };
  }
}


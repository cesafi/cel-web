'use server';

import { ServiceResponse } from '@/lib/types/base';
import { GameRosterService } from '@/services/game-roster';
import { unstable_noStore as noStore } from 'next/cache';

export async function getGameRosterByGameId(gameId: number) {
  noStore();
  return await GameRosterService.getByGameId(gameId);
}

export async function autoFillRosterFromGame1(currentGameId: number, matchId: number): Promise<ServiceResponse<void>> {
  return await GameRosterService.autoFillFromGame1(currentGameId, matchId);
}

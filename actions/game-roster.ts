'use server';

import { ServiceResponse } from '@/lib/types/base';
import { GameRosterService } from '@/services/game-roster';

export async function autoFillRosterFromGame1(currentGameId: number, matchId: number): Promise<ServiceResponse<void>> {
  return await GameRosterService.autoFillFromGame1(currentGameId, matchId);
}

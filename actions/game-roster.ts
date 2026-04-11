'use server';

import { ServiceResponse } from '@/lib/types/base';
import { GameRosterService } from '@/services/game-roster';
import { bumpExportCache } from '@/lib/utils/export-cache';
import { Database } from '@/database.types';

type GameRosterInsert = Database['public']['Tables']['game_rosters']['Insert'];

export async function getGameRosterByGameId(gameId: number) {
  return await GameRosterService.getByGameId(gameId);
}

export async function autoFillRosterFromGame1(currentGameId: number, matchId: number): Promise<ServiceResponse<void>> {
  const res = await GameRosterService.autoFillFromGame1(currentGameId, matchId);
  if (res.success) { bumpExportCache('draft'); bumpExportCache('game-results'); }
  return res;
}

export async function upsertGameRoster(roster: GameRosterInsert) {
  const res = await GameRosterService.upsert(roster);
  if (res.success) { bumpExportCache('draft'); bumpExportCache('game-results'); }
  return res;
}

export async function deleteGameRosterBySlot(gameId: number, teamId: string, sortOrder: number) {
  const res = await GameRosterService.deleteBySlot(gameId, teamId, sortOrder);
  if (res.success) { bumpExportCache('draft'); bumpExportCache('game-results'); }
  return res;
}

export async function swapGameRosterSlots(gameId: number, teamId: string, sortOrderA: number, sortOrderB: number, slotRoleA?: string, slotRoleB?: string) {
  const res = await GameRosterService.swapSlots(gameId, teamId, sortOrderA, sortOrderB, slotRoleA, slotRoleB);
  if (res.success) { bumpExportCache('draft'); bumpExportCache('game-results'); }
  return res;
}

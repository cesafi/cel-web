'use server';

import { revalidatePath } from 'next/cache';
import { PlayerSeasonService } from '@/services/player-seasons';
import { PlayerSeasonInsert, PlayerSeasonUpdate } from '@/lib/types/player-seasons';

export async function getAllPlayerSeasons() {
  return PlayerSeasonService.getAll();
}

export async function getPlayerSeasonsBySeasonId(seasonId: number) {
  return PlayerSeasonService.getBySeasonId(seasonId);
}

export async function getPlayerSeasonsByPlayerId(playerId: string) {
  return PlayerSeasonService.getByPlayerId(playerId);
}

export async function getPlayerSeasonById(id: number) {
  return PlayerSeasonService.getById(id);
}

export async function createPlayerSeason(data: PlayerSeasonInsert) {
  const result = await PlayerSeasonService.insert(data);
  if (result.success) revalidatePath('/dashboard/players');
  return result;
}

export async function updatePlayerSeasonById(data: PlayerSeasonUpdate) {
  const result = await PlayerSeasonService.updateById(data);
  if (result.success) revalidatePath('/dashboard/players');
  return result;
}

export async function deletePlayerSeasonById(id: number) {
  const result = await PlayerSeasonService.deleteById(id);
  if (result.success) revalidatePath('/dashboard/players');
  return result;
}

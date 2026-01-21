'use server';

import { revalidatePath } from 'next/cache';
import { GameHeroBanService } from '@/services/game-hero-bans';
import { GameHeroBanInsert, GameHeroBanUpdate } from '@/lib/types/game-hero-bans';

export async function getGameHeroBansByGameId(gameId: number) {
  return GameHeroBanService.getByGameId(gameId);
}

export async function getGameHeroBanById(id: string) {
  return GameHeroBanService.getById(id);
}

export async function createGameHeroBan(data: GameHeroBanInsert) {
  const result = await GameHeroBanService.insert(data);
  if (result.success) revalidatePath('/dashboard/games');
  return result;
}

export async function createGameHeroBans(data: GameHeroBanInsert[]) {
  const result = await GameHeroBanService.insertMany(data);
  if (result.success) revalidatePath('/dashboard/games');
  return result;
}

export async function updateGameHeroBanById(data: GameHeroBanUpdate) {
  const result = await GameHeroBanService.updateById(data);
  if (result.success) revalidatePath('/dashboard/games');
  return result;
}

export async function deleteGameHeroBanById(id: string) {
  const result = await GameHeroBanService.deleteById(id);
  if (result.success) revalidatePath('/dashboard/games');
  return result;
}

export async function deleteGameHeroBansByGameId(gameId: number) {
  const result = await GameHeroBanService.deleteByGameId(gameId);
  if (result.success) revalidatePath('/dashboard/games');
  return result;
}

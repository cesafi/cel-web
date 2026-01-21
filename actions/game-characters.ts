'use server';

import { revalidatePath } from 'next/cache';
import { GameCharacterService } from '@/services/game-characters';
import { GameCharacterInsert, GameCharacterUpdate } from '@/lib/types/game-characters';

export async function getAllGameCharacters() {
  return GameCharacterService.getAll();
}

export async function getAllGameCharactersWithEsport() {
  return GameCharacterService.getAllWithEsport();
}

export async function getGameCharactersByEsportId(esportId: number) {
  return GameCharacterService.getByEsportId(esportId);
}

export async function getGameCharacterById(id: number) {
  return GameCharacterService.getById(id);
}

export async function createGameCharacter(data: GameCharacterInsert) {
  const result = await GameCharacterService.insert(data);
  if (result.success) revalidatePath('/dashboard/game-characters');
  return result;
}

export async function updateGameCharacterById(data: GameCharacterUpdate) {
  const result = await GameCharacterService.updateById(data);
  if (result.success) revalidatePath('/dashboard/game-characters');
  return result;
}

export async function deleteGameCharacterById(id: number) {
  const result = await GameCharacterService.deleteById(id);
  if (result.success) revalidatePath('/dashboard/game-characters');
  return result;
}

'use server';

import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
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

export async function parseFandomImageUrl(wikiUrl: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const url = new URL(wikiUrl);

    if (url.hostname === 'static.wikia.nocookie.net') {
      return { success: true, url: wikiUrl };
    }

    if (!url.hostname.endsWith('.fandom.com')) {
      return { success: false, error: 'Not a Fandom Wiki URL' };
    }

    const wikiName = url.hostname.split('.')[0];

    let filename = url.searchParams.get('file');
    if (!filename) {
      const match = url.pathname.match(/\/wiki\/File:(.+)$/i);
      if (match) {
        filename = decodeURIComponent(match[1]);
      }
    }

    if (!filename) {
      return { success: false, error: 'No file name found in URL' };
    }

    const normalizedFilename = filename.replace(/ /g, '_');
    const hash = crypto.createHash('md5').update(normalizedFilename).digest('hex');
    const hashPart = `${hash[0]}/${hash.substring(0, 2)}`;

    const staticUrl = `https://static.wikia.nocookie.net/${wikiName}/images/${hashPart}/${normalizedFilename}/revision/latest`;

    return { success: true, url: staticUrl };
  } catch (err) {
    return { success: false, error: 'Invalid URL format' };
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { PlayerService } from '@/services/players';
import { PlayerInsert, PlayerUpdate } from '@/lib/types/players';
import { PaginationOptions, FilterValue } from '@/lib/types/base';

export async function getPaginatedPlayers(options: PaginationOptions<Record<string, FilterValue>>) {
  return PlayerService.getPaginated(options);
}

export async function getAllPlayers() {
  return PlayerService.getAll();
}

export async function getAllPlayersWithTeams() {
  return PlayerService.getAllWithTeams();
}

export async function getPlayersByTeamId(teamId: string) {
  return PlayerService.getByTeamId(teamId);
}

export async function getActivePlayers() {
  return PlayerService.getActivePlayers();
}

export async function getPlayerById(id: string) {
  return PlayerService.getById(id);
}

export async function createPlayer(data: PlayerInsert, teamId?: string | null, seasonId?: number) {
  const result = await PlayerService.insert(data);
  
  if (result.success && result.data && teamId) {
      await PlayerService.assignTeam(result.data.id, teamId, seasonId);
  }

  if (result.success) {
    revalidatePath('/dashboard/players');
  }
  return result;
}

export async function updatePlayerById(data: PlayerUpdate, teamId?: string | null, seasonId?: number) {
  const result = await PlayerService.updateById(data);
  
  if (result.success && teamId) {
      await PlayerService.assignTeam(data.id, teamId, seasonId);
  }

  if (result.success) {
    revalidatePath('/dashboard/players');
  }
  return result;
}

export async function deletePlayerById(id: string) {
  const result = await PlayerService.deleteById(id);
  if (result.success) {
    revalidatePath('/dashboard/players');
  }
  return result;
}

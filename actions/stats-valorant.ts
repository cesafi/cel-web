'use server';

import { revalidatePath } from 'next/cache';
import { StatsValorantService } from '@/services/stats-valorant';
import { StatsValorantGamePlayerInsert, StatsValorantGamePlayerUpdate } from '@/lib/types/stats-valorant';
import { bumpExportCache } from '@/lib/utils/export-cache';

export async function getValorantStatsByGameId(gameId: number) {
  return StatsValorantService.getByGameId(gameId);
}

export async function createValorantStats(data: StatsValorantGamePlayerInsert) {
  const result = await StatsValorantService.insert(data);
  if (result.success) { revalidatePath('/admin/matches'); bumpExportCache('h2h'); bumpExportCache('game-results'); }
  return result;
}

export async function createMultipleValorantStats(data: StatsValorantGamePlayerInsert[]) {
  const result = await StatsValorantService.insertMany(data);
  if (result.success) { revalidatePath('/admin/matches'); bumpExportCache('h2h'); bumpExportCache('game-results'); }
  return result;
}

export async function updateValorantStatsById(id: string, data: StatsValorantGamePlayerUpdate) {
  const result = await StatsValorantService.updateById(id, data);
  if (result.success) { revalidatePath('/admin/matches'); bumpExportCache('h2h'); bumpExportCache('game-results'); }
  return result;
}

export async function deleteValorantStatsById(id: string) {
  const result = await StatsValorantService.deleteById(id);
  if (result.success) { revalidatePath('/admin/matches'); bumpExportCache('h2h'); bumpExportCache('game-results'); }
  return result;
}

export async function deleteValorantStatsByGameId(gameId: number) {
  const result = await StatsValorantService.deleteByGameId(gameId);
  if (result.success) { revalidatePath('/admin/matches'); bumpExportCache('h2h'); bumpExportCache('game-results'); }
  return result;
}

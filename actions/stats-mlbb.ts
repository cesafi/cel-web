'use server';

import { revalidatePath } from 'next/cache';
import { StatsMlbbService } from '@/services/stats-mlbb';
import { StatsMlbbGamePlayerInsert, StatsMlbbGamePlayerUpdate } from '@/lib/types/stats-mlbb';

export async function getMlbbStatsByGameId(gameId: number) {
  return StatsMlbbService.getByGameId(gameId);
}

export async function createMlbbStats(data: StatsMlbbGamePlayerInsert) {
  const result = await StatsMlbbService.insert(data);
  if (result.success) revalidatePath('/admin/matches');
  return result;
}

export async function createMultipleMlbbStats(data: StatsMlbbGamePlayerInsert[]) {
  const result = await StatsMlbbService.insertMany(data);
  if (result.success) revalidatePath('/admin/matches');
  return result;
}

export async function updateMlbbStatsById(id: string, data: StatsMlbbGamePlayerUpdate) {
  const result = await StatsMlbbService.updateById(id, data);
  if (result.success) revalidatePath('/admin/matches');
  return result;
}

export async function deleteMlbbStatsById(id: string) {
  const result = await StatsMlbbService.deleteById(id);
  if (result.success) revalidatePath('/admin/matches');
  return result;
}

export async function deleteMlbbStatsByGameId(gameId: number) {
  const result = await StatsMlbbService.deleteByGameId(gameId);
  if (result.success) revalidatePath('/admin/matches');
  return result;
}

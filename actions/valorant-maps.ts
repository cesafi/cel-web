'use server';

import { revalidatePath } from 'next/cache';
import { ValorantMapService } from '@/services/valorant-maps';
import { ValorantMapInsert, ValorantMapUpdate } from '@/lib/types/valorant-maps';

export async function getAllValorantMaps() {
  return ValorantMapService.getAll();
}

export async function getActiveValorantMaps() {
  return ValorantMapService.getActive();
}

export async function getValorantMapById(id: number) {
  return ValorantMapService.getById(id);
}

export async function createValorantMap(data: ValorantMapInsert) {
  const result = await ValorantMapService.insert(data);
  if (result.success) revalidatePath('/dashboard/valorant-maps');
  return result;
}

export async function updateValorantMapById(data: ValorantMapUpdate) {
  const result = await ValorantMapService.updateById(data);
  if (result.success) revalidatePath('/dashboard/valorant-maps');
  return result;
}

export async function deleteValorantMapById(id: number) {
  const result = await ValorantMapService.deleteById(id);
  if (result.success) revalidatePath('/dashboard/valorant-maps');
  return result;
}

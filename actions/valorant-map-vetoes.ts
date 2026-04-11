'use server';

import { revalidatePath } from 'next/cache';
import { ValorantMapVetoService } from '@/services/valorant-map-vetoes';
import { ValorantMapVetoInsert, ValorantMapVetoUpdate } from '@/lib/types/valorant-map-vetoes';
import { bumpExportCache } from '@/lib/utils/export-cache';

export async function getValorantMapVetoesByMatchId(matchId: number) {
  return ValorantMapVetoService.getByMatchId(matchId);
}

export async function getValorantMapVetoById(id: string) {
  return ValorantMapVetoService.getById(id);
}

export async function createValorantMapVeto(data: ValorantMapVetoInsert) {
  const result = await ValorantMapVetoService.insert(data);
  if (result.success) { revalidatePath('/dashboard/matches'); bumpExportCache('map-veto'); }
  return result;
}

export async function createValorantMapVetoes(data: ValorantMapVetoInsert[]) {
  const result = await ValorantMapVetoService.insertMany(data);
  if (result.success) { revalidatePath('/dashboard/matches'); bumpExportCache('map-veto'); }
  return result;
}

export async function updateValorantMapVetoById(data: ValorantMapVetoUpdate) {
  const result = await ValorantMapVetoService.updateById(data);
  if (result.success) { revalidatePath('/dashboard/matches'); bumpExportCache('map-veto'); }
  return result;
}

export async function deleteValorantMapVetoById(id: string) {
  const result = await ValorantMapVetoService.deleteById(id);
  if (result.success) { revalidatePath('/dashboard/matches'); bumpExportCache('map-veto'); }
  return result;
}

export async function deleteValorantMapVetoesByMatchId(matchId: number) {
  const result = await ValorantMapVetoService.deleteByMatchId(matchId);
  if (result.success) { revalidatePath('/dashboard/matches'); bumpExportCache('map-veto'); }
  return result;
}

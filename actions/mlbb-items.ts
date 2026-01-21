'use server';

import { revalidatePath } from 'next/cache';
import { MlbbItemService } from '@/services/mlbb-items';
import { MlbbItemInsert, MlbbItemUpdate } from '@/lib/types/mlbb-items';

export async function getAllMlbbItems() {
  return MlbbItemService.getAll();
}

export async function getActiveMlbbItems() {
  return MlbbItemService.getActive();
}

export async function getMlbbItemById(id: number) {
  return MlbbItemService.getById(id);
}

export async function createMlbbItem(data: MlbbItemInsert) {
  const result = await MlbbItemService.insert(data);
  if (result.success) revalidatePath('/dashboard/mlbb-items');
  return result;
}

export async function updateMlbbItemById(data: MlbbItemUpdate) {
  const result = await MlbbItemService.updateById(data);
  if (result.success) revalidatePath('/dashboard/mlbb-items');
  return result;
}

export async function deleteMlbbItemById(id: number) {
  const result = await MlbbItemService.deleteById(id);
  if (result.success) revalidatePath('/dashboard/mlbb-items');
  return result;
}

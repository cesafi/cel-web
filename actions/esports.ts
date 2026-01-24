'use server';

import { EsportsService } from '@/services/esports';
import { EsportInsert, EsportUpdate } from '@/lib/types/esports';

export async function getAllEsports() {
  return await EsportsService.getAll();
}

export async function getEsportById(id: number) {
  return await EsportsService.getById(id);
}

export async function createEsport(data: EsportInsert) {
  return await EsportsService.create(data);
}

export async function updateEsport(id: number, data: EsportUpdate) {
  return await EsportsService.update(id, data);
}

export async function deleteEsport(id: number) {
  return await EsportsService.delete(id);
}

export async function getAllEsportCategories() {
  return await EsportsService.getAllCategories();
}

export async function createEsportCategory(data: { esport_id: number; division: string; levels: string }) {
  return await EsportsService.createCategory(data);
}

export async function updateEsportCategory(id: number, data: { esport_id?: number; division?: string; levels?: string }) {
  return await EsportsService.updateCategory(id, data);
}

export async function deleteEsportCategory(id: number) {
  return await EsportsService.deleteCategory(id);
}


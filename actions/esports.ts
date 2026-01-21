'use server';

import { EsportsService } from '@/services/esports';

export async function getAllEsports() {
  return await EsportsService.getAll();
}

export async function getAllEsportCategories() {
  return await EsportsService.getAllCategories();
}

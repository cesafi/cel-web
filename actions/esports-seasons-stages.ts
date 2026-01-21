'use server';

import { EsportsSeasonsStagesService } from '@/services/esports-seasons-stages';

export async function getAllEsportsSeasonsStages() {
  return await EsportsSeasonsStagesService.getAll();
}

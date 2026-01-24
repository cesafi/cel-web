'use server';

import { EsportsSeasonsStagesService } from '@/services/esports-seasons-stages';
import { Database } from '@/database.types';

type EsportsSeasonStageInsert = Database['public']['Tables']['esports_seasons_stages']['Insert'];
type EsportsSeasonStageUpdate = Database['public']['Tables']['esports_seasons_stages']['Update'];

export async function getAllEsportsSeasonsStages() {
  return await EsportsSeasonsStagesService.getAll();
}

export async function createEsportsSeasonsStage(data: EsportsSeasonStageInsert) {
  return await EsportsSeasonsStagesService.create(data);
}

export async function updateEsportsSeasonsStage(id: number, data: EsportsSeasonStageUpdate) {
  return await EsportsSeasonsStagesService.update(id, data);
}

export async function deleteEsportsSeasonsStage(id: number) {
  return await EsportsSeasonsStagesService.delete(id);
}


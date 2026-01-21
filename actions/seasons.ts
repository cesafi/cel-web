'use server';

import { PaginationOptions, ServiceResponse } from '@/lib/types/base';
import { SeasonService } from '@/services/seasons';
import { createSeasonSchema, updateSeasonSchema } from '@/lib/validations/seasons';
import { RevalidationHelper } from '@/lib/utils/revalidation';

export async function getPaginatedSeasons(options: PaginationOptions) {
  return await SeasonService.getPaginated(options);
}

export async function getAllSeasons() {
  return await SeasonService.getAll();
}

export async function getSeasonById(id: number) {
  return await SeasonService.getById(id);
}

export async function createSeason(data: unknown): Promise<ServiceResponse<undefined>> {
  // Validate the input data
  const validationResult = createSeasonSchema.safeParse(data);
  
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const result = await SeasonService.insert(validationResult.data);

  if (result.success) {
    RevalidationHelper.revalidateSeasons();
  }

  return result;
}

export async function updateSeasonById(data: unknown): Promise<ServiceResponse<undefined>> {
  // Validate the input data
  const validationResult = updateSeasonSchema.safeParse(data);
  
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const result = await SeasonService.updateById(validationResult.data);

  if (result.success) {
    RevalidationHelper.revalidateSeasons();
  }

  return result;
}

// New utility methods
export async function getCurrentSeason() {
  return await SeasonService.getCurrentSeason();
}

export async function getUpcomingSeasons() {
  return await SeasonService.getUpcomingSeasons();
}

export async function getSeasonsByYear(year: number) {
  return await SeasonService.getSeasonsByYear(year);
}

export async function deleteSeasonById(id: number) {
  const result = await SeasonService.deleteById(id);

  if (result.success) {
    RevalidationHelper.revalidateSeasons();
  }

  return result;
}
'use server';

import { PaginationOptions, FilterValue } from '@/lib/types/base';
import { SponsorInsert, SponsorUpdate } from '@/lib/types/sponsors';
import { SponsorService } from '@/services/sponsors';
import { revalidatePath } from 'next/cache';

export async function getPaginatedSponsors(
  options: PaginationOptions<Record<string, FilterValue>>
) {
  try {
    const result = await SponsorService.getPaginated(options);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.success === false ? result.error : 'No data returned from service'
      };
    }

    return {
      success: true,
      data: {
        data: result.data.data,
        totalCount: result.data.totalCount,
        pageCount: result.data.pageCount,
        currentPage: result.data.currentPage
      }
    };
  } catch {
    return {
      success: false,
      error: 'Unknown error occurred'
    };
  }
}

export async function getAllSponsors() {
  return await SponsorService.getAll();
}

export async function getActiveSponsors() {
  return await SponsorService.getActive();
}

export async function getSponsorById(id: string) {
  return await SponsorService.getById(id);
}

export async function createSponsor(data: SponsorInsert) {
  const result = await SponsorService.insert(data);

  if (result.success) {
    revalidatePath('/admin/sponsors');
  }

  return result;
}

export async function updateSponsorById(data: SponsorUpdate) {
  const result = await SponsorService.updateById(data);

  if (result.success) {
    revalidatePath('/admin/sponsors');
  }

  return result;
}

export async function deleteSponsorById(id: string) {
  const result = await SponsorService.deleteById(id);

  if (result.success) {
    revalidatePath('/admin/sponsors');
  }

  return result;
}
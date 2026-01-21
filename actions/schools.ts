'use server';

import { SchoolPaginationOptions } from '@/lib/types/schools';
import { SchoolService } from '@/services/schools';
import { createSchoolSchema, updateSchoolSchema } from '@/lib/validations/schools';
import { RevalidationHelper } from '@/lib/utils/revalidation';
import { ServiceResponse } from '@/lib/types/base';



export async function getPaginatedSchools(options: SchoolPaginationOptions) {
  try {
    const result = await SchoolService.getPaginated(options);
    
    if (!result.success || !result.data) {
      return { 
        success: false, 
        error: result.success === false ? result.error : 'No data returned from service' 
      };
    }

    // Transform the data to match the expected format
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

export async function getAllSchools() {
  return await SchoolService.getAll();
}

export async function getActiveSchools() {
  return await SchoolService.getActiveSchools();
}

export async function getPublicActiveSchools() {
  const result = await SchoolService.getActiveSchools();
  
  if (result.success && result.data) {
    return {
      ...result,
      data: result.data.filter(s => s.abbreviation !== 'TBD' && s.name !== 'To Be Determined')
    };
  }
  
  return result;
}

export async function getSchoolById(id: string) {
  return await SchoolService.getById(id);
}

export async function getSchoolByAbbreviation(abbreviation: string) {
  return await SchoolService.getByAbbreviation(abbreviation);
}

export async function createSchool(data: unknown): Promise<ServiceResponse<undefined>> {
  // Validate the input data
  const validationResult = createSchoolSchema.safeParse(data);
  
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const result = await SchoolService.insert(validationResult.data);

  if (result.success) {
    RevalidationHelper.revalidateSchools();
  }

  return result;
}

export async function updateSchoolById(data: unknown): Promise<ServiceResponse<undefined>> {
  // Validate the input data
  const validationResult = updateSchoolSchema.safeParse(data);
  
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const result = await SchoolService.updateById(validationResult.data);

  if (result.success) {
    RevalidationHelper.revalidateSchools();
  }

  return result;
}

export async function deleteSchoolById(id: string) {
  const result = await SchoolService.deleteById(id);

  if (result.success) {
    RevalidationHelper.revalidateSchools();
  }

  return result;
}

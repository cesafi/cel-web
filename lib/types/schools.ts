import { z } from 'zod';
import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';
import { createSchoolSchema, updateSchoolSchema } from '@/lib/validations/schools';

export type School = Database['public']['Tables']['schools']['Row'];
export type SchoolInsert = z.infer<typeof createSchoolSchema>;
export type SchoolUpdate = z.infer<typeof updateSchoolSchema>;

export interface SchoolSearchFilters {
  name?: string;
  address?: string;
  created_at?: {
    gte?: string;
    lte?: string;
  };
}

export type SchoolPaginationOptions = PaginationOptions<
  SchoolSearchFilters & Record<string, FilterValue>
>;

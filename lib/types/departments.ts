import { z } from 'zod';
import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';
import { createDepartmentSchema, updateDepartmentSchema } from '@/lib/validations/departments';

export type Department = Database['public']['Tables']['departments']['Row'];
export type DepartmentInsert = z.infer<typeof createDepartmentSchema>;
export type DepartmentUpdate = z.infer<typeof updateDepartmentSchema>;

export interface DepartmentSearchFilters {
  name?: string;
  created_at?: {
    gte?: string;
    lte?: string;
  };
}

export type DepartmentPaginationOptions = PaginationOptions<
  DepartmentSearchFilters & Record<string, FilterValue>
>;

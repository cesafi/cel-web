import { z } from 'zod';
import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';
import { createSeasonSchema, updateSeasonSchema } from '@/lib/validations/seasons';

export type Season = Database['public']['Tables']['seasons']['Row'] & { name?: string | null };
export type SeasonInsert = z.infer<typeof createSeasonSchema>;
export type SeasonUpdate = z.infer<typeof updateSeasonSchema>;

export interface SeasonSearchFilters {
  start_at?: {
    gte?: string;
    lte?: string;
  };
  end_at?: {
    gte?: string;
    lte?: string;
  };
  created_at?: {
    gte?: string;
    lte?: string;
  };
}

export type SeasonPaginationOptions = PaginationOptions<
  SeasonSearchFilters & Record<string, FilterValue>
>;

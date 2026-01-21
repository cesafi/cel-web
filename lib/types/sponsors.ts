import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';

// Direct database type mapping
export type Sponsor = Database['public']['Tables']['sponsors']['Row'];
export type SponsorInsert = Database['public']['Tables']['sponsors']['Insert'];
export type SponsorUpdate = Database['public']['Tables']['sponsors']['Update'];

// Search filters for sponsors
export interface SponsorSearchFilters {
  title?: string;
  tagline?: string;
  is_active?: boolean;
  created_at?: {
    gte?: string;
    lte?: string;
  };
}

// Pagination options for sponsors
export type SponsorPaginationOptions = PaginationOptions<
  SponsorSearchFilters & Record<string, FilterValue>
>;
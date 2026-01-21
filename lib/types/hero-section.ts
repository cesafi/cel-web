import { z } from 'zod';
import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';
import { createHeroSectionLiveSchema, updateHeroSectionLiveSchema } from '@/lib/validations/hero-section';

// Base hero section live types from database
export type HeroSectionLive = Database['public']['Tables']['hero_section_live']['Row'];
export type HeroSectionLiveInsert = z.infer<typeof createHeroSectionLiveSchema>;
export type HeroSectionLiveUpdate = z.infer<typeof updateHeroSectionLiveSchema>;

// Search filters for hero section live
export interface HeroSectionLiveSearchFilters {
  video_link?: string;
  is_active?: boolean; // Computed based on end_at
}

// Pagination options for hero section live
export type HeroSectionLivePaginationOptions = PaginationOptions<
  HeroSectionLiveSearchFilters & Record<string, FilterValue>
>;

// Hero section live with additional computed fields
export interface HeroSectionLiveWithDetails extends HeroSectionLive {
  is_active: boolean; // Computed based on end_at
  is_expired: boolean; // Computed based on end_at
  time_remaining?: string; // Computed time until expiration
  formatted_end_date?: string; // Formatted end date
}

// Service response for getting current active hero section
export interface CurrentHeroSectionResponse {
  success: boolean;
  data?: HeroSectionLiveWithDetails | null;
  error?: string;
}

import { z } from 'zod';
import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';
import { createTimelineSchema, updateTimelineSchema } from '@/lib/validations/timeline';

// Direct database type mapping
export type Timeline = Database['public']['Tables']['cesafi_timeline']['Row'];
export type TimelineInsert = z.infer<typeof createTimelineSchema>;
export type TimelineUpdate = z.infer<typeof updateTimelineSchema>;

// Timeline category enum
export type TimelineCategory = 'founding' | 'milestone' | 'award' | 'expansion' | 'achievement';

// Search filters for timeline
export interface TimelineSearchFilters {
  category?: TimelineCategory;
  year?: string;
  is_highlight?: boolean;
  title?: string;
  created_at?: {
    gte?: string;
    lte?: string;
  };
}

// Pagination options for timeline
export type TimelinePaginationOptions = PaginationOptions<
  TimelineSearchFilters & Record<string, FilterValue>
>;

// Timeline with additional computed fields
export interface TimelineWithDetails extends Timeline {
  // Add any computed fields here if needed
  display_year?: string;
  category_display?: string;
}

import { z } from 'zod';
import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';
import { createPhotoGallerySchema, updatePhotoGallerySchema } from '@/lib/validations/photo-gallery';

// Base photo gallery types from database
export type PhotoGallery = Database['public']['Tables']['photo_gallery']['Row'];
export type PhotoGalleryInsert = z.infer<typeof createPhotoGallerySchema>;
export type PhotoGalleryUpdate = z.infer<typeof updatePhotoGallerySchema>;

// Search filters for photo gallery
export interface PhotoGallerySearchFilters {
  title?: string;
  photo_by?: string;
}

// Pagination options for photo gallery
export type PhotoGalleryPaginationOptions = PaginationOptions<
  PhotoGallerySearchFilters & Record<string, FilterValue>
>;

// Photo gallery with additional computed fields
export interface PhotoGalleryWithDetails extends PhotoGallery {
  // Add any computed fields here if needed
  formatted_date?: string;
}

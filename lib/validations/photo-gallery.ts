import { z } from 'zod';

export const createPhotoGallerySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  caption: z.string().min(1, 'Caption is required'),
  category: z.enum(['sports', 'events', 'awards', 'general', 'team', 'facilities'], {
    message: 'Please select a valid category'
  }),
  photo_by: z.string().min(1, 'Photographer name is required'),
  photo_url: z.string().url('Please provide a valid photo URL'),
});

export const updatePhotoGallerySchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  caption: z.string().min(1, 'Caption is required').optional(),
  category: z.enum(['sports', 'events', 'awards', 'general', 'team', 'facilities'], {
    message: 'Please select a valid category'
  }).optional(),
  photo_by: z.string().min(1, 'Photographer name is required').optional(),
  photo_url: z.string().url('Please provide a valid photo URL').optional(),
});

export type CreatePhotoGalleryInput = z.infer<typeof createPhotoGallerySchema>;
export type UpdatePhotoGalleryInput = z.infer<typeof updatePhotoGallerySchema>;

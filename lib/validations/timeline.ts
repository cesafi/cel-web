import { z } from 'zod';

// Timeline category enum validation
const timelineCategorySchema = z.enum(['founding', 'milestone', 'award', 'expansion', 'achievement'], {
  message: 'Category must be one of: founding, milestone, award, expansion, achievement.'
});

// Create timeline schema
export const createTimelineSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: 'Title is required.' })
      .max(200, { message: 'Title must be 200 characters or less.' }),
    description: z
      .string()
      .min(1, { message: 'Description is required.' })
      .max(1000, { message: 'Description must be 1000 characters or less.' }),
    year: z
      .string()
      .min(4, { message: 'Year must be at least 4 characters.' })
      .max(10, { message: 'Year must be 10 characters or less.' })
      .regex(/^\d{4}(\+\+?)?$/, { message: 'Year must be a valid year format (e.g., 2001, 2025+).' }),
    category: timelineCategorySchema,
    image_url: z
      .string()
      .url({ message: 'Image URL must be a valid URL.' })
      .min(1, { message: 'Image URL is required.' }),
    is_highlight: z
      .boolean()
      .default(false)
  })
  .refine(
    (data) => {
      // Validate year format more strictly
      const year = data.year;
      if (year.includes('+')) {
        return year.match(/^\d{4}\+?$/);
      }
      return year.match(/^\d{4}$/);
    },
    { message: 'Year must be a valid year format (e.g., 2001, 2025+).', path: ['year'] }
  );

// Update timeline schema
export const updateTimelineSchema = createTimelineSchema.partial().extend({
  id: z.number().int().positive({ message: 'ID must be a positive integer.' })
});

// Timeline search filters schema
export const timelineSearchFiltersSchema = z.object({
  category: timelineCategorySchema.optional(),
  year: z.string().optional(),
  is_highlight: z.boolean().optional(),
  title: z.string().optional(),
  created_at: z.object({
    gte: z.string().optional(),
    lte: z.string().optional()
  }).optional()
});

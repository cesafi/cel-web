import { z } from 'zod';

export const createSponsorSchema = z
  .object({
    title: z.string().min(1, { message: 'Sponsor title is required.' }),
    tagline: z.string().min(1, { message: 'Sponsor tagline is required.' }),
    logo_url: z.string().url({ message: 'Logo URL must be a valid URL.' }).optional().nullable(),
    is_active: z.boolean().default(true)
  })
  .refine(
    (data) => {
      return data.title.length >= 2;
    },
    { message: 'Title must be at least 2 characters long.', path: ['title'] }
  )
  .refine(
    (data) => {
      return data.tagline.length >= 3;
    },
    { message: 'Tagline must be at least 3 characters long.', path: ['tagline'] }
  );

export const updateSponsorSchema = createSponsorSchema.partial().extend({
  id: z.string().uuid({ message: 'ID must be a valid UUID.' })
});

// Legacy exports for backward compatibility
export const SponsorInsertSchema = createSponsorSchema;
export const SponsorUpdateSchema = updateSponsorSchema;
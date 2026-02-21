import { z } from 'zod';

const sponsorTypeEnum = z.enum(['title', 'venue', 'event']);

// Base sponsor fields (without refinements)
const baseSponsorFields = {
  title: z.string().min(1, { message: 'Sponsor title is required.' }).min(2, { message: 'Title must be at least 2 characters long.' }),
  tagline: z.string().min(1, { message: 'Sponsor tagline is required.' }).min(3, { message: 'Tagline must be at least 3 characters long.' }),
  logo_url: z.string().url({ message: 'Logo URL must be a valid URL.' }).optional().nullable(),
  dark_logo_url: z.string().url({ message: 'Dark logo URL must be a valid URL.' }).optional().nullable(),
  is_active: z.boolean().default(true),
  type: sponsorTypeEnum.optional().nullable(),
  display_order: z.coerce.number().int().min(0, { message: 'Display order must be a non-negative integer.' }).optional().nullable(),
};

export const createSponsorSchema = z.object(baseSponsorFields);

export const updateSponsorSchema = z.object({
  id: z.string().uuid({ message: 'ID must be a valid UUID.' }),
  title: baseSponsorFields.title.optional(),
  tagline: baseSponsorFields.tagline.optional(),
  logo_url: baseSponsorFields.logo_url,
  dark_logo_url: baseSponsorFields.dark_logo_url,
  is_active: baseSponsorFields.is_active.optional(),
  type: baseSponsorFields.type,
  display_order: baseSponsorFields.display_order,
});

// Legacy exports for backward compatibility
export const SponsorInsertSchema = createSponsorSchema;
export const SponsorUpdateSchema = updateSponsorSchema;

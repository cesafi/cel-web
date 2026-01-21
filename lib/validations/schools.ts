import { z } from 'zod';

export const createSchoolSchema = z.object({
  name: z.string().min(1, { message: 'School name is required.' }),
  abbreviation: z
    .string()
    .min(2, { message: 'Abbreviation must be at least 2 characters.' })
    .max(10, { message: 'Abbreviation cannot exceed 10 characters.' }),
  logo_url: z
    .string()
    .min(1, { message: 'School logo is required.' })
    .url({ message: 'Please upload a valid logo image.' }),
  is_active: z.boolean().default(true)
});

export const updateSchoolSchema = z.object({
  id: z.string({ message: 'ID is required for updating a school.' }),
  name: z.string().min(1, { message: 'School name cannot be empty.' }).optional(),
  abbreviation: z
    .union([
      z
        .string()
        .min(2, { message: 'Abbreviation must be at least 2 characters.' })
        .max(10, { message: 'Abbreviation cannot exceed 10 characters.' }),
      z.literal(''),
      z.undefined()
    ])
    .optional(),
  logo_url: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

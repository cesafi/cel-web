import { z } from 'zod';

export const createVolunteerSchema = z.object({
  full_name: z.string().min(1, { message: 'Full name is required.' }),
  title: z.string().nullable().optional(),
  image_url: z
    .string()
    .min(1, { message: 'Volunteer photo is required.' })
    .url({ message: 'Please upload a valid photo.' }),
  is_active: z.boolean().default(true),
  department_id: z.number().nullable().optional(),
  season_id: z.number().nullable().optional()
});

export const updateVolunteerSchema = z.object({
  id: z.string().uuid({ message: 'ID is required for updating.' }),
  full_name: z.string().min(1, { message: 'Full name cannot be empty.' }).optional(),
  title: z.string().nullable().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  department_id: z.number().nullable().optional(),
  season_id: z.number().nullable().optional()
});

export type VolunteerInsert = z.infer<typeof createVolunteerSchema>;
export type VolunteerUpdate = z.infer<typeof updateVolunteerSchema>;
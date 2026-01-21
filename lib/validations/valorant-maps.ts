import { z } from 'zod';

export const createValorantMapSchema = z.object({
  name: z.string().min(1, { message: 'Map name is required.' }),
  splash_image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true)
});

export const updateValorantMapSchema = z.object({
  id: z.number({ message: 'ID is required for updating.' }),
  name: z.string().min(1).optional(),
  splash_image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional()
});

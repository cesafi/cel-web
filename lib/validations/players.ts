import { z } from 'zod';

export const createPlayerSchema = z.object({
  ign: z.string().min(1, { message: 'In-game name is required.' }),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  role: z.string().optional().nullable(),
  team_id: z.string().optional().nullable(),
  is_active: z.boolean().default(true)
});

export const updatePlayerSchema = z.object({
  id: z.string({ message: 'ID is required for updating a player.' }),
  ign: z.string().min(1, { message: 'In-game name cannot be empty.' }).optional(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  role: z.string().optional().nullable(),
  team_id: z.string().optional().nullable(),
  is_active: z.boolean().optional()
});

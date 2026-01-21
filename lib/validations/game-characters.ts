import { z } from 'zod';

export const createGameCharacterSchema = z.object({
  name: z.string().min(1, { message: 'Character name is required.' }),
  role: z.string().min(1, { message: 'Role is required.' }),
  esport_id: z.number().optional().nullable()
});

export const updateGameCharacterSchema = z.object({
  id: z.number({ message: 'ID is required for updating.' }),
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  esport_id: z.number().optional().nullable()
});

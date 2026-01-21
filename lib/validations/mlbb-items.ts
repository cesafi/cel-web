import { z } from 'zod';

export const createMlbbItemSchema = z.object({
  name: z.string().min(1, { message: 'Item name is required.' }).nullable(),
  is_active: z.boolean().default(true).nullable()
});

export const updateMlbbItemSchema = z.object({
  id: z.number({ message: 'ID is required for updating.' }),
  name: z.string().min(1).optional().nullable(),
  is_active: z.boolean().optional().nullable()
});

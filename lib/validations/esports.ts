import { z } from 'zod';

export const createsportschema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const updatesportschema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
});

export const createsportCategorySchema = z.object({
  esport_id: z.number(),
  division: z.string(),
  levels: z.string(),
});

export const updatesportCategorySchema = z.object({
  id: z.number(),
  esport_id: z.number().optional(),
  division: z.string().optional(),
  levels: z.string().optional(),
});

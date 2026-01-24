import { z } from 'zod';

export const createEsportSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  abbreviation: z.string().max(10, 'Abbreviation must be 10 characters or less').optional().nullable(),
  logo_url: z.string().url('Invalid URL format').optional().nullable(),
});

export const updateEsportSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  abbreviation: z.string().max(10, 'Abbreviation must be 10 characters or less').optional().nullable(),
  logo_url: z.string().url('Invalid URL format').optional().nullable(),
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


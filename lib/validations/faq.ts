import { z } from 'zod';

export const createFaqSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500, 'Question must be less than 500 characters'),
  answer: z.string().min(1, 'Answer is required').max(2000, 'Answer must be less than 2000 characters'),
  is_open: z.boolean().default(false),
  display_order: z.number().int().min(0, 'Display order must be a positive number'),
  is_active: z.boolean().default(true),
  category: z.string().default('General'),
  is_highlight: z.boolean().default(false),
});

export const updateFaqSchema = createFaqSchema.partial();

export const faqSearchSchema = z.object({
  searchQuery: z.string().optional(),
  is_active: z.boolean().optional(),
  is_open: z.boolean().optional(),
});

export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
export type FaqSearchInput = z.infer<typeof faqSearchSchema>;


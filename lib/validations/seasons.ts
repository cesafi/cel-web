import { z } from 'zod';

export const createSeasonSchema = z
  .object({
    id: z.number().int().positive('Season number must be a positive integer'),
    start_at: z.string().min(1, 'Start date is required'),
    end_at: z.string().min(1, 'End date is required')
  })
  .refine(
    (data) => {
      if (data.start_at && data.end_at) {
        return new Date(data.start_at) < new Date(data.end_at);
      }
      return true;
    },
    {
      message: 'Start date must be before end date',
      path: ['end_at']
    }
  );

export const updateSeasonSchema = z
  .object({
    id: z.number({ message: 'ID is required for updating a season.' }),
    start_at: z.string().min(1, 'Start date is required').optional(),
    end_at: z.string().min(1, 'End date is required').optional()
  })
  .refine(
    (data) => {
      if (data.start_at && data.end_at) {
        return new Date(data.start_at) < new Date(data.end_at);
      }
      return true;
    },
    {
      message: 'Start date must be before end date',
      path: ['end_at']
    }
  );

// Export inferred types
export type SeasonInsert = z.infer<typeof createSeasonSchema>;
export type SeasonUpdate = z.infer<typeof updateSeasonSchema>;
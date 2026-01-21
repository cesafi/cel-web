import { z } from 'zod';
import { toUtcIsoString, isValidUtcIsoString } from '@/lib/utils/utc-time';

export const createHeroSectionLiveSchema = z.object({
  video_link: z.string().url('Please provide a valid video URL'),
  end_at: z.string()
    .min(1, 'End date is required')
    .transform((date) => {
      // Convert to UTC ISO string for consistent storage
      return toUtcIsoString(date);
    })
    .refine(
      (utcDate) => {
        const endDate = new Date(utcDate);
        const now = new Date();
        return endDate > now;
      },
      'End date must be in the future'
    )
    .refine(
      (utcDate) => isValidUtcIsoString(utcDate),
      'Invalid date format'
    ),
  created_at: z.string()
    .optional()
    .transform((date) => {
      if (!date) return undefined;
      return toUtcIsoString(date);
    }),
});

export const updateHeroSectionLiveSchema = z.object({
  video_link: z.string().url('Please provide a valid video URL').optional(),
  end_at: z.string()
    .min(1, 'End date is required')
    .transform((date) => {
      // Convert to UTC ISO string for consistent storage
      return toUtcIsoString(date);
    })
    .refine(
      (utcDate) => {
        const endDate = new Date(utcDate);
        const now = new Date();
        return endDate > now;
      },
      'End date must be in the future'
    )
    .refine(
      (utcDate) => isValidUtcIsoString(utcDate),
      'Invalid date format'
    )
    .optional(),
  created_at: z.string()
    .optional()
    .transform((date) => {
      if (!date) return undefined;
      return toUtcIsoString(date);
    }),
});

export type CreateHeroSectionLiveInput = z.infer<typeof createHeroSectionLiveSchema>;
export type UpdateHeroSectionLiveInput = z.infer<typeof updateHeroSectionLiveSchema>;



import { z } from 'zod';
import { toUtcIsoString, isValidUtcIsoString } from '@/lib/utils/utc-time';

export const createMatchSchema = z
  .object({
    name: z
      .string({ message: 'Match name is required.' })
      .min(1, { message: 'Match name cannot be empty.' })
      .max(255, { message: 'Match name cannot exceed 255 characters.' }),
    description: z
      .string({ message: 'Match description is required.' })
      .min(1, { message: 'Match description cannot be empty.' }),
    venue: z
      .string({ message: 'Venue is required.' })
      .min(1, { message: 'Venue cannot be empty.' }),
    best_of: z
      .number({ message: 'Best of must be a number.' })
      .int({ message: 'Best of must be an integer.' })
      .positive({ message: 'Best of must be positive.' })
      .default(1),
    stage_id: z.number({ message: 'Stage ID is required.' }),
    status: z.enum(['upcoming', 'live', 'finished', 'cancelled'], {
      message: 'Status must be one of: upcoming, ongoing, finished, cancelled.'
    }).default('upcoming'),
    scheduled_at: z.string()
      .optional()
      .nullable()
      .transform((date) => {
        if (!date) return null;
        return toUtcIsoString(date);
      })
      .refine(
        (utcDate) => !utcDate || isValidUtcIsoString(utcDate),
        'Invalid scheduled date format'
      ),
    start_at: z.string()
      .optional()
      .nullable()
      .transform((date) => {
        if (!date) return null;
        return toUtcIsoString(date);
      })
      .refine(
        (utcDate) => !utcDate || isValidUtcIsoString(utcDate),
        'Invalid start date format'
      ),
    end_at: z.string()
      .optional()
      .nullable()
      .transform((date) => {
        if (!date) return null;
        return toUtcIsoString(date);
      })
      .refine(
        (utcDate) => !utcDate || isValidUtcIsoString(utcDate),
        'Invalid end date format'
      )
  })
  .refine(
    (data) => {
      if (data.start_at && data.end_at) {
        return new Date(data.start_at) < new Date(data.end_at);
      }
      return true;
    },
    {
      message: 'Start date must be before end date.',
      path: ['end_at']
    }
  )
  .refine(
    (data) => {
      if (data.scheduled_at && data.start_at) {
        return new Date(data.scheduled_at) <= new Date(data.start_at);
      }
      return true;
    },
    {
      message: 'Scheduled date must be before or equal to start date.',
      path: ['start_at']
    }
  );

export const updateMatchSchema = z
  .object({
    id: z.number({ message: 'ID is required for updating a match.' }),
    name: z
      .string()
      .min(1, { message: 'Match name cannot be empty.' })
      .max(255, { message: 'Match name cannot exceed 255 characters.' })
      .optional(),
    description: z.string().min(1, { message: 'Match description cannot be empty.' }).optional(),
    venue: z
      .string()
      .min(1, { message: 'Venue cannot be empty.' })
      .optional(),
    best_of: z
      .number({ message: 'Best of must be a number.' })
      .int({ message: 'Best of must be an integer.' })
      .positive({ message: 'Best of must be positive.' })
      .optional(),
    stage_id: z
      .number({ message: 'Stage ID is required.' })
      .optional(),
    status: z.enum(['upcoming', 'live', 'finished', 'cancelled'], {
      message: 'Status must be one of: upcoming, ongoing, finished, cancelled.'
    }).optional(),
    scheduled_at: z.string()
      .optional()
      .nullable()
      .transform((date) => {
        if (!date) return null;
        return toUtcIsoString(date);
      })
      .refine(
        (utcDate) => !utcDate || isValidUtcIsoString(utcDate),
        'Invalid scheduled date format'
      ),
    start_at: z.string()
      .optional()
      .nullable()
      .transform((date) => {
        if (!date) return null;
        return toUtcIsoString(date);
      })
      .refine(
        (utcDate) => !utcDate || isValidUtcIsoString(utcDate),
        'Invalid start date format'
      ),
    end_at: z.string()
      .optional()
      .nullable()
      .transform((date) => {
        if (!date) return null;
        return toUtcIsoString(date);
      })
      .refine(
        (utcDate) => !utcDate || isValidUtcIsoString(utcDate),
        'Invalid end date format'
      )
  })
  .refine(
    (data) => {
      if (data.start_at && data.end_at) {
        return new Date(data.start_at) < new Date(data.end_at);
      }
      return true;
    },
    {
      message: 'Start date must be before end date.',
      path: ['end_at']
    }
  )
  .refine(
    (data) => {
      if (data.scheduled_at && data.start_at) {
        return new Date(data.scheduled_at) <= new Date(data.start_at);
      }
      return true;
    },
    {
      message: 'Scheduled date must be before or equal to start date.',
      path: ['start_at']
    }
  );

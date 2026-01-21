import { z } from 'zod';

export const createGameSchema = z
  .object({
    match_id: z.number({ message: 'Match ID is required.' }),
    game_number: z
      .number({ message: 'Game number must be a number.' })
      .int({ message: 'Game number must be an integer.' })
      .positive({ message: 'Game number must be positive.' })
      .default(1),
    duration: z
      .string({ message: 'Duration must be a string.' })
      .regex(/^\d{2}:\d{2}:\d{2}$/, {
        message: 'Duration must be in HH:MM:SS format.'
      })
      .default('00:00:00'),

    start_at: z.string().optional().nullable(),
    end_at: z.string().optional().nullable()
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
  );

export const updateGameSchema = z
  .object({
    id: z.number({ message: 'ID is required for updating a game.' }),
    match_id: z.number({ message: 'Match ID is required.' }).optional(),
    game_number: z
      .number({ message: 'Game number must be a number.' })
      .int({ message: 'Game number must be an integer.' })
      .positive({ message: 'Game number must be positive.' })
      .optional(),
    duration: z
      .string({ message: 'Duration must be a string.' })
      .regex(/^\d{2}:\d{2}:\d{2}$/, {
        message: 'Duration must be in HH:MM:SS format.'
      })
      .optional(),
    start_at: z.string().optional().nullable(),
    end_at: z.string().optional().nullable()
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
  );

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
      .regex(/^(\d{2}:)?\d{2}:\d{2}$/, {
        message: 'Duration must be in MM:SS or HH:MM:SS format.'
      })
      .transform(val => val.split(':').length === 2 ? `00:${val}` : val)
      .default('00:00'),

    start_at: z.string().optional().nullable(),
    end_at: z.string().optional().nullable(),
    status: z.enum(['pending', 'drafting', 'in_progress', 'completed', 'cancelled']).optional().default('pending'),
    valorant_map_id: z.number().nullable().optional(),
    mlbb_map_id: z.number().nullable().optional()
  })
  .strict()
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
      .regex(/^(\d{2}:)?\d{2}:\d{2}$/, {
        message: 'Duration must be in MM:SS or HH:MM:SS format.'
      })
      .transform(val => val.split(':').length === 2 ? `00:${val}` : val)
      .optional(),
    start_at: z.string().optional().nullable(),
    end_at: z.string().optional().nullable(),
    valorant_map_id: z.number().nullable().optional(),
    coin_toss_winner: z.string().nullable().optional(),
    side_selection: z.string().nullable().optional(),
    status: z.enum(['pending', 'drafting', 'in_progress', 'completed', 'cancelled']).optional()
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

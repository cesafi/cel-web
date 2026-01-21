import { z } from 'zod';

export const createGameScoreSchema = z.object({
  game_id: z.number({ message: 'Game ID is required.' }),
  match_participant_id: z.number({ message: 'Match participant ID is required.' }),
  score: z
    .number({ message: 'Score must be a number.' })
    .min(0, { message: 'Score cannot be negative.' })
    .max(1000000, { message: 'Score cannot exceed 1,000,000.' })
});

export const updateGameScoreSchema = z.object({
  id: z.number({ message: 'ID is required for updating a game score.' }),
  game_id: z.number({ message: 'Game ID is required.' }).optional(),
  match_participant_id: z.number({ message: 'Match participant ID is required.' }).optional(),
  score: z
    .number({ message: 'Score must be a number.' })
    .min(0, { message: 'Score cannot be negative.' })
    .max(1000000, { message: 'Score cannot exceed 1,000,000.' })
    .optional()
});

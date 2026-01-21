import { z } from 'zod';

export const createMatchParticipantSchema = z.object({
  match_id: z.number({ message: 'Match ID is required.' }),
  team_id: z.string({ message: 'Team ID is required.' }),
  match_score: z
    .number({ message: 'Match score must be a number.' })
    .int({ message: 'Match score must be an integer.' })
    .min(0, { message: 'Match score cannot be negative.' })
    .nullable()
    .optional()
});

export const updateMatchParticipantSchema = z.object({
  id: z.number({ message: 'ID is required for updating a match participant.' }),
  match_id: z.number({ message: 'Match ID is required.' }).optional(),
  team_id: z.string({ message: 'Team ID is required.' }).optional(),
  match_score: z
    .number({ message: 'Match score must be a number.' })
    .int({ message: 'Match score must be an integer.' })
    .min(0, { message: 'Match score cannot be negative.' })
    .nullable()
    .optional()
});

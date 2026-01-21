import { z } from 'zod';

export const createPlayerSeasonSchema = z.object({
  player_id: z.string({ message: 'Player ID is required.' }),
  season_id: z.number({ message: 'Season ID is required.' }),
  is_active: z.boolean().default(true).nullable()
});

export const updatePlayerSeasonSchema = z.object({
  id: z.number({ message: 'ID is required for updating.' }),
  player_id: z.string().optional(),
  season_id: z.number().optional(),
  is_active: z.boolean().optional().nullable()
});

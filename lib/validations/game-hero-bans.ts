import { z } from 'zod';

export const createGameHeroBanSchema = z.object({
  game_id: z.number({ message: 'Game ID is required.' }),
  team_id: z.string({ message: 'Team ID is required.' }),
  hero_name: z.string().min(1, { message: 'Hero name is required.' }),
  ban_order: z.number().optional().nullable()
});

export const updateGameHeroBanSchema = z.object({
  id: z.string({ message: 'ID is required for updating.' }),
  game_id: z.number().optional(),
  team_id: z.string().optional(),
  hero_name: z.string().min(1).optional(),
  ban_order: z.number().optional().nullable()
});

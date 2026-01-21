import { z } from 'zod';

export const createValorantMapVetoSchema = z.object({
  match_id: z.number({ message: 'Match ID is required.' }),
  team_id: z.string({ message: 'Team ID is required.' }),
  map_name: z.string().min(1, { message: 'Map name is required.' }),
  action: z.enum(['pick', 'ban', 'remain']),
  sequence_order: z.number(),
  side_selected: z.enum(['attack', 'defense']).optional().nullable()
});

export const updateValorantMapVetoSchema = z.object({
  id: z.string({ message: 'ID is required for updating.' }),
  match_id: z.number().optional(),
  team_id: z.string().optional(),
  map_name: z.string().min(1).optional(),
  action: z.enum(['pick', 'ban', 'remain']).optional(),
  sequence_order: z.number().optional(),
  side_selected: z.enum(['attack', 'defense']).optional().nullable()
});

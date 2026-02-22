import { z } from 'zod';
import { GameDraftActionInsert, GameDraftActionUpdate } from '../types/game-draft';

export const insertGameDraftActionSchema = z.object({
  game_id: z.number().int().positive("Game ID must be a positive integer"),
  team_id: z.string().uuid("Team ID must be a valid UUID"),
  hero_name: z.string().min(1, "Hero name is required"),
  hero_id: z.number().int().positive("Hero ID must be a positive integer"),
  action_type: z.enum(['ban', 'pick'], {
    message: "Action type must be either 'ban' or 'pick'"
  }),
  sort_order: z.number().int().min(0, "Sort order must be non-negative"),
  is_locked: z.boolean().optional().default(false),
});

export const updateGameDraftActionSchema = z.object({
  id: z.string().uuid("Action ID must be a valid UUID"),
  is_locked: z.boolean(),
});

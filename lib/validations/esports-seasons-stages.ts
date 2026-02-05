import { z } from 'zod';

export const createsportsSeasonsStageSchema = z.object({
  competition_stage: z.string().min(1, { message: 'Competition stage is required.' }),
  esport_category_id: z.number().optional().nullable(),
  season_id: z.number().optional().nullable(),
  stage_type: z.enum(['round_robin', 'single_elimination', 'double_elimination']).default('round_robin'),
  points_win: z.number().optional().nullable(),
  points_draw: z.number().optional().nullable(),
  points_loss: z.number().optional().nullable()
});

export const updatesportsSeasonsStageSchema = z.object({
  id: z.number({ message: 'ID is required for updating.' }),
  competition_stage: z.string().min(1).optional(),
  esport_category_id: z.number().optional().nullable(),
  season_id: z.number().optional().nullable(),
  stage_type: z.enum(['round_robin', 'single_elimination', 'double_elimination']).optional(),
  points_win: z.number().optional().nullable(),
  points_draw: z.number().optional().nullable(),
  points_loss: z.number().optional().nullable()
});

import { z } from 'zod';

export const standingsFiltersSchema = z.object({
  season_id: z.number().int().positive().optional(),
  sport_id: z.number().int().positive().optional(),
  esport_category_id: z.number().int().positive().optional(),
  stage_id: z.number().int().positive().optional(),
  competition_stage: z.enum(['group_stage', 'playins', 'playoffs', 'finals']).optional()
});

export const standingsSearchParamsSchema = z.object({
  season: z.string().regex(/^\d+$/).transform(Number).optional(),
  sport: z.string().regex(/^\d+$/).transform(Number).optional(),
  category: z.string().regex(/^\d+$/).transform(Number).optional(),
  stage: z.string().regex(/^\d+$/).transform(Number).optional()
});

export type StandingsFiltersInput = z.infer<typeof standingsFiltersSchema>;
export type StandingsSearchParamsInput = z.infer<typeof standingsSearchParamsSchema>;

import { z } from 'zod';
import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';
import { createGameScoreSchema, updateGameScoreSchema } from '@/lib/validations/game-scores';

export type GameScore = Database['public']['Tables']['game_scores']['Row'];
export type GameScoreInsert = z.infer<typeof createGameScoreSchema>;
export type GameScoreUpdate = z.infer<typeof updateGameScoreSchema>;

export interface GameScoreDetailedView extends GameScore {
  [key: string]: unknown;
}

export interface GameScoreSearchFilters {
  match_id?: number;
  game_number?: number;
  match_participant_id?: number;
  score?: number;
  created_at?: {
    gte?: string;
    lte?: string;
  };
}

export type GameScorePaginationOptions = PaginationOptions<
  GameScoreSearchFilters & Record<string, FilterValue>
>;

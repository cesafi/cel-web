import { z } from 'zod';
import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';
import { createPlayerSchema, updatePlayerSchema } from '@/lib/validations/players';

export type Player = Database['public']['Tables']['players']['Row'];
export type PlayerInsert = z.infer<typeof createPlayerSchema>;
export type PlayerUpdate = z.infer<typeof updatePlayerSchema>;

export interface PlayerWithTeam extends Player {
  schools_teams: {
    id: string;
    name: string;
    school_id: string;
    schools: {
      id: string;
      name: string;
      abbreviation: string;
      logo_url: string | null;
    } | null;
  } | null;
  [key: string]: unknown;
}

export interface PlayerSearchFilters {
  ign?: string;
  first_name?: string;
  last_name?: string;
  team_id?: string;
  is_active?: boolean;
}

export type PlayerPaginationOptions = PaginationOptions<
  PlayerSearchFilters & Record<string, FilterValue>
>;

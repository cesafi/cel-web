import { Database } from '@/database.types';

export type PlayerSeason = Database['public']['Tables']['player_seasons']['Row'];
export type PlayerSeasonInsert = Database['public']['Tables']['player_seasons']['Insert'];
export type PlayerSeasonUpdate = Database['public']['Tables']['player_seasons']['Update'];

export interface PlayerSeasonWithDetails extends PlayerSeason {
  players: {
    id: string;
    ign: string;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    role: string | null;
  } | null;
  schools_teams: {
    id: string;
    name: string;
    season_id: number;
    esport_category_id: number;
    seasons: {
      id: number;
      name?: string | null;
      start_at: string;
      end_at: string;
    } | null;
    schools: {
      id: string;
      name: string;
      abbreviation: string;
      logo_url: string | null;
    } | null;
    esports_categories: {
      id: number;
      division: string;
      levels: string;
      esports: {
        id: number;
        name: string;
      } | null;
    } | null;
  } | null;
}


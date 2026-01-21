import { Database } from '@/database.types';

export type StatsValorantGamePlayer = Database['public']['Tables']['stats_valorant_game_player']['Row'];
export type StatsValorantGamePlayerInsert = Database['public']['Tables']['stats_valorant_game_player']['Insert'];
export type StatsValorantGamePlayerUpdate = Database['public']['Tables']['stats_valorant_game_player']['Update'];

export interface StatsValorantGamePlayerWithDetails extends StatsValorantGamePlayer {
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
    schools: {
      id: string;
      name: string;
      abbreviation: string;
      logo_url: string | null;
    } | null;
  } | null;
}

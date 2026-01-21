import { Database } from '@/database.types';

export type StatsMlbbGamePlayer = Database['public']['Tables']['stats_mlbb_game_player']['Row'];
export type StatsMlbbGamePlayerInsert = Database['public']['Tables']['stats_mlbb_game_player']['Insert'];
export type StatsMlbbGamePlayerUpdate = Database['public']['Tables']['stats_mlbb_game_player']['Update'];

export interface StatsMlbbGamePlayerWithDetails extends StatsMlbbGamePlayer {
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

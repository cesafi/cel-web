import { Database } from '@/database.types';

export type GameHeroBan = Database['public']['Tables']['game_hero_bans']['Row'];
export type GameHeroBanInsert = Database['public']['Tables']['game_hero_bans']['Insert'];
export type GameHeroBanUpdate = Database['public']['Tables']['game_hero_bans']['Update'];

export interface GameHeroBanWithTeam extends GameHeroBan {
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

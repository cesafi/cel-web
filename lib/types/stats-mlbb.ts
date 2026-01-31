
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

// Extracted Data from OCR
export interface MlbbScreenshotData {
  matchResult: 'VICTORY' | 'DEFEAT';
  score: {
    blue: number; // Left side
    red: number;  // Right side
  };
  duration?: string; // e.g. "12:43"
  players: MlbbPlayerScreenshotStat[];
}

export interface MlbbPlayerScreenshotStat {
  heroName: string;
  playerName: string;
  team: 'Blue' | 'Red'; // Left is Blue, Right is Red
  kda: {
    kills: number;
    deaths: number;
    assists: number;
  };
  gold: number;
  rating: number; // The score (e.g. 9.8)
  badge?: 'MVP' | 'Gold' | 'Silver' | 'Bronze' | null;
}

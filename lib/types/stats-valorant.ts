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

// Extracted Data from OCR (Raw)
export interface ValorantScreenshotData {
  matchResult: 'VICTORY' | 'DEFEAT' | 'DRAW';
  score: {
    ally: number;
    enemy: number;
  };
  mapName: string;
  matchDuration?: string; // e.g. "00:35:12"
  players: ValorantPlayerScreenshotStat[];
}

export interface ValorantPlayerScreenshotStat {
  agentName: string;
  playerName: string;
  team: 'Ally' | 'Enemy'; // Based on color usually, or relative to the screenshot taker
  acs: number;
  kda: {
    kills: number;
    deaths: number;
    assists: number;
  };
  econRating?: number; 
  firstBloods: number;
  plants?: number; 
  defuses?: number; 
  // Derived/mapped fields for UI
  mappedPlayerId?: string;
  mappedTeamId?: string;
}

// UI State for the Editor
export interface StatsEditState {
  gameId: number | null;
  extractedData: ValorantScreenshotData | null;
  playerMapping: Record<string, string>; // playerName from OCR -> system playerId
  teamMapping: Record<string, string>; // 'Ally'/'Enemy' -> system teamId
}

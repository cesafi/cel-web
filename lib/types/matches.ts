import { Database } from '@/database.types';

export type Match = Database['public']['Tables']['matches']['Row'];
export type MatchInsert = Database['public']['Tables']['matches']['Insert'];
export type MatchUpdate = Database['public']['Tables']['matches']['Update'];

export type MatchParticipant = Database['public']['Tables']['match_participants']['Row'];
export type Game = Database['public']['Tables']['games']['Row'];

export interface MatchWithFullDetails extends Match {
  match_participants: (MatchParticipant & {
    schools_teams: {
      id: string;
      name: string;
      school: {
        id: number;
        name: string;
        abbreviation: string;
        logo_url: string | null;
      } | null;
    } | null;
  })[];
  games: Game[];
  esports_seasons_stages: {
    id: number;
    name: string;
    season_id: number | null;
    competition_stage: string;
    esports_categories: {
      id: number;
      division: string;
      levels: string;
      esports: {
        id: number;
        name: string;
        logo_url: string | null;
        abbreviation: string | null;
      } | null;
    } | null;
    seasons: {
      id: number;
      name?: string | null;
      start_at: string;
      end_at: string;
    } | null;
  } | null;
  [key: string]: unknown;
}

export interface ScheduleMatch extends MatchWithFullDetails {
  isToday?: boolean;
  isPast?: boolean;
  displayTime?: string;
  displayDate?: string;
}

export interface ScheduleFilters {
  sport?: string;
  sport_id?: number;
  category?: string;
  category_id?: number;
  division?: string; // New filter for category division
  date?: string;
  status?: string;
  season_id?: number;
  stage_id?: number;
  stage_name?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface MatchScoreUpdate {
  match_id: number;
  team_id: string;
  match_score: number | null;
}

export interface MatchWithStageDetails extends Match {
  esports_seasons_stages?: {
    id: number;
    competition_stage: string;
    esports_categories: {
      id: number;
      division: string;
      levels: string;
      esports: {
        id: number;
        name: string;
        logo_url: string | null;
        abbreviation: string | null;
      } | null;
    } | null;
  } | null;
  [key: string]: unknown;
}

export interface SchedulePaginationOptions {
  page?: number;
  pageSize?: number;
  limit?: number;
  cursor?: string;
  direction?: 'future' | 'past';
  filters?: ScheduleFilters;
}

export interface ScheduleResponse {
  matches: ScheduleMatch[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

export interface LeagueOperatorStats {
  totalMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  pendingActions: number;
  matchesToday: number;
  activeStages: number;
  participatingTeams: number;
  averageAttendance: number;
}

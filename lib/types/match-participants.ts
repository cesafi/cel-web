import { z } from 'zod';
import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';
import { createMatchParticipantSchema, updateMatchParticipantSchema } from '@/lib/validations/match-participants';

export type MatchParticipant = Database['public']['Tables']['match_participants']['Row'];
export type MatchParticipantInsert = z.infer<typeof createMatchParticipantSchema>;
export type MatchParticipantUpdate = z.infer<typeof updateMatchParticipantSchema>;

export interface MatchParticipantSearchFilters {
  match_id?: number;
  team_id?: string;
  placement?: number;
  created_at?: {
    gte?: string;
    lte?: string;
  };
}

export type MatchParticipantPaginationOptions = PaginationOptions<
  MatchParticipantSearchFilters & Record<string, FilterValue>
>;

// Detailed view types for service responses
export interface MatchParticipantWithTeamDetails {
  id: number;
  match_id: number;
  team_id: string;
  match_score: number | null;
  created_at: string;
  updated_at: string;
  schools_teams: {
    id: string;
    name: string;
    schools: {
      name: string;
      abbreviation: string;
    };
  };
}

export interface MatchParticipantWithMatchDetails {
  id: number;
  match_id: number;
  team_id: string;
  match_score: number | null;
  created_at: string;
  updated_at: string;
  matches: {
    id: number;
    name: string;
    scheduled_at: string | null;
  };
}

export interface MatchParticipantWithFullDetails {
  id: number;
  match_id: number;
  team_id: string;
  match_score: number | null;
  created_at: string;
  updated_at: string;
  schools_teams: {
    id: string;
    name: string;
    schools: {
      name: string;
      abbreviation: string;
      logo_url: string | null;
    };
  };
  matches: {
    id: number;
    name: string;
    scheduled_at: string | null;
  };
  [key: string]: unknown;
}

// Type for match participants as returned by the service (without created_at, updated_at, matches)
export interface MatchParticipantWithTeamDetailsOnly {
  id: number;
  match_id: number;
  team_id: string;
  match_score: number | null;
  schools_teams: {
    id: string;
    name: string;
    schools: {
      name: string;
      abbreviation: string;
      logo_url: string | null;
    };
  };
}

export interface MatchParticipantWithMatchHistory {
  id: number;
  match_id: number;
  team_id: string;
  match_score: number | null;
  created_at: string;
  updated_at: string;
  matches: {
    id: number;
    name: string;
    scheduled_at: string | null;
    venue: string;
    esports_seasons_stages: {
      competition_stage: string;
      esports_categories: {
        division: string;
        levels: string;
        esports: {
          name: string;
        };
      };
    };
  };
}


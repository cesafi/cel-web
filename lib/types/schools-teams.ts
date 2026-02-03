import { z } from 'zod';
import { Database } from '@/database.types';
import { FilterValue, PaginationOptions } from './base';
import { createSchoolTeamSchema, updateSchoolTeamSchema } from '@/lib/validations/schools-teams';

export type SchoolsTeam = Database['public']['Tables']['schools_teams']['Row'];
export type SchoolsTeamInsert = z.infer<typeof createSchoolTeamSchema>;
export type SchoolsTeamUpdate = z.infer<typeof updateSchoolTeamSchema>;

export interface SchoolsTeamSearchFilters {
  school_id?: string;
  season_id?: number;
  esport_category_id?: number;
  team_name?: string;
  created_at?: {
    gte?: string;
    lte?: string;
  };
}

export type SchoolsTeamPaginationOptions = PaginationOptions<
  SchoolsTeamSearchFilters & Record<string, FilterValue>
>;

// Type for teams with esports category details
export interface SchoolsTeamWithSportDetails {
  id: string;
  name: string;
  school_id: string;
  season_id: number;
  esport_category_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  esports_categories: {
    id: number;
    division: string;
    levels: string;
    esports: {
      id: number;
      name: string;
    } | null;
  } | null;
  seasons: {
    id: number;
    name?: string | null;
  } | null;
  [key: string]: unknown; // Index signature for BaseEntity compatibility
}

export interface SchoolsTeamWithSchoolDetails {
  id: string;
  name: string;
  school_id: string;
  season_id: number;
  esport_category_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  schools: {
    name: string;
    abbreviation: string;
    logo_url: string | null;
  } | null;
}

export interface SchoolsTeamWithFullDetails {
  id: string;
  name: string;
  school_id: string;
  season_id: number;
  esport_category_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  esports_categories: {
    id: number;
    division: string;
    levels: string;
    esports: {
      id: number;
      name: string;
    } | null;
  } | null;
  seasons: {
    id: number;
    start_at: string;
    end_at: string;
  } | null;
  schools: {
    name: string;
    abbreviation: string;
    logo_url: string | null;
  } | null;
}

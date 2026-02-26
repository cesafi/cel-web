// Service class for schools_teams table operations

import {
  ServiceResponse
} from '@/lib/types/base';
import { BaseService } from './base';
import { SchoolsTeamWithSchoolDetails, SchoolsTeamWithSportDetails, SchoolsTeamWithFullDetails, SchoolsTeam, SchoolsTeamInsert, SchoolsTeamUpdate } from '@/lib/types/schools-teams';

const TABLE_NAME = 'schools_teams';

export class SchoolsTeamService extends BaseService {
  static async getByStageId(stageId: number): Promise<ServiceResponse<SchoolsTeamWithSchoolDetails[]>> {
    try {
      const supabase = await this.getClient();

      // First, get the stage details to find which season and category it belongs to
      const { data: stage, error: stageError } = await supabase
        .from('esports_seasons_stages')
        .select('season_id, esport_category_id')
        .eq('id', stageId)
        .single();

      if (stageError) {
        throw stageError;
      }

      if (!stage || !stage.season_id || !stage.esport_category_id) {
        return { success: false, error: 'Invalid stage or missing season/category information' };
      }

      // Then fetch teams that match the season and category
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          schools (
            name,
            abbreviation,
            logo_url
          )
        `)
        .eq('season_id', stage.season_id)
        .eq('esport_category_id', stage.esport_category_id)
        .order('name');

      if (error) {
        throw error;
      }
      
      return { success: true, data: data as unknown as SchoolsTeamWithSchoolDetails[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch teams for stage ${stageId}`);
    }
  }

  static async getBySchoolAndSeason(schoolId: string, seasonId: number): Promise<ServiceResponse<SchoolsTeamWithSportDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          esports_categories (
            id,
            division,
            levels,
            esports (
              id,
              name
            )
          ),
          seasons (
            id,
            name
          )
        `)
        .eq('school_id', schoolId)
        .eq('season_id', seasonId)
        .order('name');

      if (error) throw error;
      return { success: true, data: data as unknown as SchoolsTeamWithSportDetails[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch teams for school and season`);
    }
  }

  static async getActiveBySchool(schoolId: string): Promise<ServiceResponse<SchoolsTeamWithSportDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          esports_categories (
            id,
            division,
            levels,
            esports (
              id,
              name
            )
          ),
          seasons (
            id,
            name
          )
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { success: true, data: data as unknown as SchoolsTeamWithSportDetails[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch active teams for school`);
    }
  }

  static async getAll(): Promise<ServiceResponse<SchoolsTeamWithSportDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          esports_categories (
            id,
            division,
            levels,
            esports (
              id,
              name
            )
          )
        `)
        .order('name');

      if (error) throw error;
      return { success: true, data: data as unknown as SchoolsTeamWithSportDetails[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all teams`);
    }
  }

  static async getById(id: string): Promise<ServiceResponse<SchoolsTeamWithFullDetails>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          esports_categories (
            id,
            division,
            levels,
            esports (
              id,
              name
            )
          ),
          seasons (
            id,
            name,
            start_at,
            end_at
          ),
          schools (
            name,
            abbreviation,
            logo_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data: data as unknown as SchoolsTeamWithFullDetails };
    } catch (err) {
      return this.formatError(err, `Failed to fetch team by ID`);
    }
  }

  /**
   * Find a team by slugified name and school abbreviation (for clean URLs)
   * Slug format: season-esport-division-teamname
   */
  static async getBySlugAndSchool(teamSlug: string, schoolAbbreviation: string): Promise<ServiceResponse<SchoolsTeamWithFullDetails>> {
    try {
      const supabase = await this.getClient();
      const { teamMatchesSlug } = await import('@/lib/utils/team-slug');

      // First get the school ID from abbreviation
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id')
        .ilike('abbreviation', schoolAbbreviation)
        .single();

      if (schoolError || !school) {
        return { success: false, error: 'School not found' };
      }

      // Fetch all teams for this school with full details
      const { data: teams, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          esports_categories (
            id,
            division,
            levels,
            esports (
              id,
              name
            )
          ),
          seasons (
            id,
            name,
            start_at,
            end_at
          ),
          schools (
            name,
            abbreviation,
            logo_url
          )
        `)
        .eq('school_id', school.id);

      if (error) throw error;
      if (!teams || teams.length === 0) {
        return { success: false, error: 'No teams found for this school' };
      }

      // Match by slug
      const match = teams.find((t: any) =>
        teamMatchesSlug({
          seasonName: t.seasons?.name || '',
          esportName: t.esports_categories?.esports?.name || '',
          division: t.esports_categories?.division || '',
          teamName: t.name || '',
        }, teamSlug)
      );

      if (!match) {
        return { success: false, error: 'Team not found' };
      }

      return { success: true, data: match as unknown as SchoolsTeamWithFullDetails };
    } catch (err) {
      return this.formatError(err, `Failed to fetch team by slug and school`);
    }
  }

  static async insert(team: SchoolsTeamInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(team);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create team`);
    }
  }

  static async updateById(team: SchoolsTeamUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = team;
      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id!);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update team`);
    }
  }

  static async deleteById(id: string): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete team`);
    }
  }
}

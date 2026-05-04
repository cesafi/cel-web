import { z } from 'zod';
import {
  PaginatedResponse,
  PaginationOptions,
  ServiceResponse,
  FilterValue
} from '@/lib/types/base';
import { BaseService } from './base';
import { Season } from '@/lib/types/seasons';
import { createSeasonSchema, updateSeasonSchema } from '@/lib/validations/seasons';

const TABLE_NAME = 'seasons';
const esports_seasons_stages_TABLE = 'esports_seasons_stages';
const SCHOOLS_TEAMS_TABLE = 'schools_teams';

export class SeasonService extends BaseService {
  static async getPaginated(
    options: PaginationOptions<Record<string, FilterValue>>,
    selectQuery: string = '*'
  ): Promise<ServiceResponse<PaginatedResponse<Season>>> {
    try {
      const searchableFields = ['id'];
      const optionsWithSearchableFields = {
        ...options,
        searchableFields
      };

      const result = await this.getPaginatedData<Season, typeof TABLE_NAME>(
        TABLE_NAME,
        optionsWithSearchableFields,
        selectQuery
      );

      return result;
    } catch (err) {
      return this.formatError(err, `Failed to retrieve paginated seasons`);
    }
  }

  static async getAll(): Promise<ServiceResponse<Season[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .order('start_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all seasons`);
    }
  }

  static async getCount(): Promise<ServiceResponse<number>> {
    try {
      const supabase = await this.getClient();
      const { count, error } = await supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return { success: true, data: count || 0 };
    } catch (err) {
      return this.formatError(err, `Failed to get seasons count`);
    }
  }

  static async getById(id: number): Promise<ServiceResponse<Season>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.from(TABLE_NAME).select().eq('id', id).single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch season`);
    }
  }

  static async insert(
    data: z.infer<typeof createSeasonSchema>
  ): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();

      // Check for date range overlap with existing seasons
      const { data: existingSeasons, error: checkError } = await supabase
        .from(TABLE_NAME)
        .select('id, start_at, end_at')
        .or(
          `and(start_at.lte.${data.start_at},end_at.gte.${data.start_at}),and(start_at.lte.${data.end_at},end_at.gte.${data.end_at}),and(start_at.gte.${data.start_at},end_at.lte.${data.end_at})`
        );

      if (checkError) {
        throw checkError;
      }

      if (existingSeasons && existingSeasons.length > 0) {
        const overlappingSeasons = existingSeasons
          .map((s) => `${s.start_at} to ${s.end_at}`)
          .join(', ');

        return {
          success: false,
          error: `Season dates overlap with existing season(s): ${overlappingSeasons}`
        };
      }

      const { error } = await supabase.from(TABLE_NAME).insert(data);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to insert new season`);
    }
  }

  static async updateById(
    data: z.infer<typeof updateSeasonSchema>
  ): Promise<ServiceResponse<undefined>> {
    try {
      if (!data.id) {
        return { success: false, error: 'Season ID is required to update.' };
      }

      const supabase = await this.getClient();

      // If updating dates, check for overlap with other seasons
      if (data.start_at || data.end_at) {
        // Get current season data to fill in missing dates
        const { data: currentSeason, error: currentError } = await supabase
          .from(TABLE_NAME)
          .select('start_at, end_at')
          .eq('id', data.id)
          .single();

        if (currentError) {
          throw currentError;
        }

        const startAt = data.start_at || currentSeason.start_at;
        const endAt = data.end_at || currentSeason.end_at;

        const { data: existingSeasons, error: checkError } = await supabase
          .from(TABLE_NAME)
          .select('id, start_at, end_at')
          .neq('id', data.id) // Exclude current season from overlap check
          .or(
            `and(start_at.lte.${startAt},end_at.gte.${startAt}),and(start_at.lte.${endAt},end_at.gte.${endAt}),and(start_at.gte.${startAt},end_at.lte.${endAt})`
          );

        if (checkError) {
          throw checkError;
        }

        if (existingSeasons && existingSeasons.length > 0) {
          const overlappingSeasons = existingSeasons
            .map((s) => `${s.start_at} to ${s.end_at}`)
            .join(', ');

          return {
            success: false,
            error: `Updated season dates would overlap with existing season(s): ${overlappingSeasons}`
          };
        }
      }

      const { error } = await supabase.from(TABLE_NAME).update(data).eq('id', data.id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update season`);
    }
  }

  static async getRelatedDataCount(
    id: number
  ): Promise<ServiceResponse<{ sportsSeasonsStages: number; schoolsTeams: number }>> {
    try {
      const supabase = await this.getClient();

      // Count esports_seasons_stages related to this season
      const { count: sportsSeasonsStagesCount, error: sportsError } = await supabase
        .from(esports_seasons_stages_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('season_id', id);

      if (sportsError) {
        throw sportsError;
      }

      // Count schools_teams related to this season
      const { count: schoolsTeamsCount, error: schoolsError } = await supabase
        .from(SCHOOLS_TEAMS_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('season_id', id);

      if (schoolsError) {
        throw schoolsError;
      }

      return {
        success: true,
        data: {
          sportsSeasonsStages: sportsSeasonsStagesCount || 0,
          schoolsTeams: schoolsTeamsCount || 0
        }
      };
    } catch (err) {
      return this.formatError(err, `Failed to get related data count for season`);
    }
  }

  static async deleteById(id: number): Promise<ServiceResponse<undefined>> {
    try {
      if (!id) {
        return { success: false, error: 'Season ID is required to delete.' };
      }

      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete season`);
    }
  }

  // Utility methods for date-based operations
  static async getCurrentSeason(): Promise<ServiceResponse<Season | null>> {
    try {
      const supabase = await this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .lte('start_at', now)
        .gte('end_at', now)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        throw error;
      }

      return { success: true, data: data || null };
    } catch (err) {
      return this.formatError(err, `Failed to get current season`);
    }
  }

  static async getLatestOrOngoingSeason(): Promise<ServiceResponse<Season | null>> {
    try {
      const supabase = await this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .lte('start_at', now)
        .order('start_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no past or ongoing season exists, just get the first one (e.g. future season)
      if (!data) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from(TABLE_NAME)
          .select()
          .order('start_at', { ascending: true })
          .limit(1)
          .single();
          
        if (fallbackError && fallbackError.code !== 'PGRST116') {
            throw fallbackError;
        }
        
        return { success: true, data: fallbackData || null };
      }

      return { success: true, data: data || null };
    } catch (err) {
      return this.formatError(err, `Failed to get latest or ongoing season`);
    }
  }

  static async getUpcomingSeasons(limit: number = 5): Promise<ServiceResponse<Season[]>> {
    try {
      const supabase = await this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .gt('start_at', now)
        .order('start_at', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (err) {
      return this.formatError(err, `Failed to get upcoming seasons`);
    }
  }

  static async getSeasonsByYear(year: number): Promise<ServiceResponse<Season[]>> {
    try {
      const supabase = await this.getClient();
      const startOfYear = `${year}-01-01T00:00:00Z`;
      const endOfYear = `${year}-12-31T23:59:59Z`;

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .or(
          `and(start_at.gte.${startOfYear},start_at.lte.${endOfYear}),and(end_at.gte.${startOfYear},end_at.lte.${endOfYear})`
        )
        .order('start_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (err) {
      return this.formatError(err, `Failed to get seasons for year ${year}`);
    }
  }
}

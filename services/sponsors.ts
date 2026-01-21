import {
  PaginatedResponse,
  PaginationOptions,
  ServiceResponse,
  FilterValue
} from '@/lib/types/base';
import { BaseService } from './base';
import { Sponsor, SponsorInsert, SponsorUpdate } from '@/lib/types/sponsors';

const TABLE_NAME = 'sponsors';

export class SponsorService extends BaseService {
  static async getPaginated(
    options: PaginationOptions<Record<string, FilterValue>>,
    selectQuery: string = '*'
  ): Promise<ServiceResponse<PaginatedResponse<Sponsor>>> {
    try {
      const searchableFields = ['title', 'tagline'];
      const optionsWithSearchableFields = {
        ...options,
        searchableFields
      };

      const result = await this.getPaginatedData<Sponsor, typeof TABLE_NAME>(
        TABLE_NAME,
        optionsWithSearchableFields,
        selectQuery
      );

      return result;
    } catch (err) {
      return this.formatError(err, `Failed to retrieve paginated ${TABLE_NAME}.`);
    }
  }

  static async getAll(): Promise<ServiceResponse<Sponsor[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.from(TABLE_NAME).select();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME}.`);
    }
  }

  static async getActive(): Promise<ServiceResponse<Sponsor[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch active ${TABLE_NAME}.`);
    }
  }

  static async getById(id: string): Promise<ServiceResponse<Sponsor>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.from(TABLE_NAME).select().eq('id', id).single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch ${TABLE_NAME} entity.`);
    }
  }

  static async insert(data: SponsorInsert): Promise<ServiceResponse<undefined>> {
    try {
      // Validate required fields
      if (!data.title) {
        return { success: false, error: 'Title is required.' };
      }

      if (!data.tagline) {
        return { success: false, error: 'Tagline is required.' };
      }

      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(data);

      if (error) {
        // Handle specific database errors
        if (error.code === '23505') {
          return { success: false, error: 'Sponsor with this title already exists.' };
        }
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to insert new ${TABLE_NAME} entity.`);
    }
  }

  static async updateById(data: SponsorUpdate): Promise<ServiceResponse<undefined>> {
    try {
      if (!data.id) {
        return { success: false, error: 'Sponsor ID is required to update.' };
      }

      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).update(data).eq('id', data.id);

      if (error) {
        // Handle specific database errors
        if (error.code === '23505') {
          return { success: false, error: 'Sponsor with this title already exists.' };
        }
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update ${TABLE_NAME} entity.`);
    }
  }

  static async deleteById(id: string): Promise<ServiceResponse<undefined>> {
    try {
      if (!id) {
        return { success: false, error: 'Sponsor ID is required to delete.' };
      }

      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete ${TABLE_NAME} entity.`);
    }
  }
}
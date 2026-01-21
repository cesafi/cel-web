import {
  PaginatedResponse,
  PaginationOptions,
  ServiceResponse,
  FilterValue
} from '@/lib/types/base';
import { BaseService } from './base';
import { School, SchoolInsert, SchoolUpdate } from '@/lib/types/schools';
import CloudinaryService from './cloudinary';
import { nowUtc } from '@/lib/utils/utc-time';

const TABLE_NAME = 'schools';

export class SchoolService extends BaseService {
  static async getPaginated(
    options: PaginationOptions<Record<string, FilterValue>>,
    selectQuery: string = '*'
  ): Promise<ServiceResponse<PaginatedResponse<School>>> {
    try {
      const searchableFields = ['name', 'abbreviation'];
      const optionsWithSearchableFields = {
        ...options,
        searchableFields
      };

      const result = await this.getPaginatedData<School, 'schools', Record<string, FilterValue>>(
        'schools',
        optionsWithSearchableFields,
        selectQuery
      );

      return result;
    } catch (err) {
      return this.formatError(err, `Failed to retrieve paginated schools`);
    }
  }

  static async getAll(): Promise<ServiceResponse<School[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data: data as School[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME} entity.`);
    }
  }

  static async getActiveSchools(): Promise<ServiceResponse<School[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch active ${TABLE_NAME} entities.`);
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
      return this.formatError(err, `Failed to get ${TABLE_NAME} count.`);
    }
  }

  static async getById(id: string): Promise<ServiceResponse<School>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.from(TABLE_NAME).select().eq('id', id).single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch ${TABLE_NAME} entity.`);
    }
  }

  static async getByAbbreviation(abbreviation: string): Promise<ServiceResponse<School>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .ilike('abbreviation', abbreviation)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch school by abbreviation.`);
    }
  }

  static async insert(data: SchoolInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();

      const { error } = await supabase.from(TABLE_NAME).insert({
        ...data,
        created_at: nowUtc(),
        updated_at: nowUtc()
      });

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to insert new ${TABLE_NAME} entity.`);
    }
  }

  static async updateById(data: SchoolUpdate): Promise<ServiceResponse<undefined>> {
    try {
      if (!data.id) {
        return { success: false, error: 'Entity ID is required to update.' };
      }

      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).update({
        ...data,
        updated_at: nowUtc()
      }).eq('id', data.id);

      if (error) {
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
        return { success: false, error: 'Entity ID is required to delete.' };
      }

      const supabase = await this.getClient();

      // First, get the school to check if it has a logo
      const { data: school, error: fetchError } = (await supabase
        .from(TABLE_NAME)
        .select('logo_url')
        .eq('id', id)
        .single()) as { data: { logo_url: string | null } | null; error: Error | null };

      if (fetchError) {
        throw fetchError;
      }

      // Delete the logo from Cloudinary if it exists
      if (school?.logo_url) {
        try {
          // Extract public_id from the URL for deletion
          const url = school.logo_url;
          // Match the full path after /upload/ or /upload/vX_Y_Z/ and remove extension
          const publicIdMatch = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(jpg|jpeg|png|gif|webp)$/i);

          if (publicIdMatch) {
            const publicId = publicIdMatch[1]; // This includes the full folder path without extension

            await CloudinaryService.deleteImage(publicId, { resourceType: 'image' });
          }
        } catch (cloudinaryError) {
          // Log the error but don't block the database deletion
          console.warn('Failed to delete school logo from Cloudinary:', cloudinaryError);
        }
      }

      // Now delete from database
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete ${TABLE_NAME} entity.`);
    }
  }
}

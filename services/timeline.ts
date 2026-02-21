// Service class for cesafi_timeline table operations

import { ServiceResponse, PaginatedResponse, PaginationOptions, FilterValue } from '@/lib/types/base';
import { BaseService } from './base';
import { Timeline, TimelineInsert, TimelineUpdate } from '@/lib/types/timeline';
import CloudinaryService, { extractCloudinaryPublicId } from './cloudinary';

const TABLE_NAME = 'cesafi_timeline';

export class TimelineService extends BaseService {
  static async getPaginated(
    options: PaginationOptions<Record<string, FilterValue>>
  ): Promise<ServiceResponse<PaginatedResponse<Timeline>>> {
    try {
      const searchableFields = ['title', 'description', 'year', 'category'];
      const optionsWithSearchableFields = {
        ...options,
        searchableFields
      };

      const result = await this.getPaginatedData<Timeline, 'cesafi_timeline', Record<string, FilterValue>>(
        'cesafi_timeline',
        optionsWithSearchableFields
      );

      return result;
    } catch (err) {
      return this.formatError(err, `Failed to retrieve paginated timeline entries`);
    }
  }

  static async getAll(): Promise<ServiceResponse<Timeline[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .order('year', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all timeline entries.`);
    }
  }

  static async getById(id: number): Promise<ServiceResponse<Timeline>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch timeline entry by ID.`);
    }
  }

  static async getHighlights(): Promise<ServiceResponse<Timeline[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('is_highlight', true)
        .order('year', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch timeline highlights.`);
    }
  }

  static async getByCategory(category: string): Promise<ServiceResponse<Timeline[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('category', category)
        .order('year', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch timeline by category.`);
    }
  }

  static async insert(entry: TimelineInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(entry);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create timeline entry.`);
    }
  }

  static async updateById(entry: TimelineUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = entry;
      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id!);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update timeline entry.`);
    }
  }

  static async deleteById(id: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();

      // Fetch image URL before deleting
      const { data: entry, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('image_url')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from Cloudinary if image exists
      if (entry?.image_url) {
        try {
          const publicId = extractCloudinaryPublicId(entry.image_url);
          if (publicId) {
            await CloudinaryService.deleteImage(publicId, { resourceType: 'image' });
          }
        } catch (cloudinaryError) {
          console.warn('Failed to delete timeline image from Cloudinary:', cloudinaryError);
        }
      }

      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete timeline entry.`);
    }
  }
}

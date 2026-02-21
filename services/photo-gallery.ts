import { BaseService } from './base';
import { PhotoGallery, PhotoGalleryInsert, PhotoGalleryUpdate, PhotoGalleryPaginationOptions } from '@/lib/types/photo-gallery';
import { ServiceResponse, PaginatedResponse } from '@/lib/types/base';
import CloudinaryService, { extractCloudinaryPublicId } from './cloudinary';

const TABLE_NAME = 'photo_gallery' as const;

export class PhotoGalleryService extends BaseService {
  protected static tableName = TABLE_NAME;

  /**
   * Get paginated photo gallery items with search and filters
   */
  static async getPaginated(options: PhotoGalleryPaginationOptions): Promise<ServiceResponse<PaginatedResponse<PhotoGallery>>> {
    try {
      const searchableFields = ['title', 'caption', 'photo_by'];
      const optionsWithSearchableFields = {
        ...options,
        searchableFields
      };

      const result = await this.getPaginatedData<PhotoGallery, 'photo_gallery'>(
        TABLE_NAME,
        optionsWithSearchableFields,
        '*'
      );

      return result;
    } catch (err) {
      return this.formatError(err, `Failed to retrieve paginated ${TABLE_NAME}.`);
    }
  }

  /**
   * Get all photo gallery items (for public display)
   */
  static async getAll(): Promise<ServiceResponse<PhotoGallery[]>> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME}.`);
    }
  }


  /**
   * Get a single photo gallery item by ID
   */
  static async getById(id: number): Promise<ServiceResponse<PhotoGallery>> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch ${TABLE_NAME} with ID ${id}.`);
    }
  }

  /**
   * Create new photo gallery item
   */
  static async insert(photoData: PhotoGalleryInsert): Promise<ServiceResponse<PhotoGallery>> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from(TABLE_NAME)
        .insert(photoData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to create ${TABLE_NAME}.`);
    }
  }

  /**
   * Update photo gallery item by ID
   */
  static async updateById(id: number, photoData: PhotoGalleryUpdate): Promise<ServiceResponse<PhotoGallery>> {
    try {
      const client = await this.getClient();
      const { data, error } = await client
        .from(TABLE_NAME)
        .update({ ...photoData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to update ${TABLE_NAME} with ID ${id}.`);
    }
  }

  /**
   * Delete photo gallery item by ID
   */
  static async deleteById(id: number): Promise<ServiceResponse<null>> {
    try {
      const client = await this.getClient();

      // Fetch photo URL before deleting
      const { data: photo, error: fetchError } = await client
        .from(TABLE_NAME)
        .select('photo_url')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from Cloudinary if photo exists
      if (photo?.photo_url) {
        try {
          const publicId = extractCloudinaryPublicId(photo.photo_url);
          if (publicId) {
            await CloudinaryService.deleteImage(publicId, { resourceType: 'image' });
          }
        } catch (cloudinaryError) {
          console.warn('Failed to delete gallery photo from Cloudinary:', cloudinaryError);
        }
      }

      const { error } = await client
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, data: null };
    } catch (err) {
      return this.formatError(err, `Failed to delete ${TABLE_NAME} with ID ${id}.`);
    }
  }
}



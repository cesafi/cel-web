'use server';

import { RevalidationHelper } from '@/lib/utils/revalidation';
import { PhotoGalleryService } from '@/services/photo-gallery';
import { PhotoGalleryInsert, PhotoGalleryUpdate, PhotoGalleryPaginationOptions } from '@/lib/types/photo-gallery';
import { createPhotoGallerySchema, updatePhotoGallerySchema } from '@/lib/validations/photo-gallery';

/**
 * Get paginated photo gallery items
 */
export async function getPaginatedPhotoGallery(options: PhotoGalleryPaginationOptions) {
  try {
    const result = await PhotoGalleryService.getPaginated(options);
    return result;
  } catch (error) {
    console.error('Error fetching paginated photo gallery:', error);
    return { success: false, error: 'Failed to fetch photo gallery items' };
  }
}

/**
 * Get all photo gallery items (for public display)
 */
export async function getAllPhotoGallery() {
  try {
    const result = await PhotoGalleryService.getAll();
    return result;
  } catch (error) {
    console.error('Error fetching all photo gallery:', error);
    return { success: false, error: 'Failed to fetch all photo gallery items' };
  }
}

/**
 * Get photo gallery items by category
 */
export async function getPhotoGalleryByCategory(category: string) {
  try {
    const result = await PhotoGalleryService.getByCategory(category);
    return result;
  } catch (error) {
    console.error(`Error fetching photo gallery by category ${category}:`, error);
    return { success: false, error: `Failed to fetch photo gallery items for category ${category}` };
  }
}

/**
 * Get a single photo gallery item by ID
 */
export async function getPhotoGalleryById(id: number) {
  try {
    const result = await PhotoGalleryService.getById(id);
    return result;
  } catch (error) {
    console.error(`Error fetching photo gallery with ID ${id}:`, error);
    return { success: false, error: `Failed to fetch photo gallery item with ID ${id}` };
  }
}

/**
 * Create a new photo gallery item
 */
export async function createPhotoGallery(data: PhotoGalleryInsert) {
  try {
    const validatedData = createPhotoGallerySchema.parse(data);
    const result = await PhotoGalleryService.insert(validatedData);
    RevalidationHelper.revalidatePhotoGallery();
    return result;
  } catch (error: unknown) {
    console.error('Error creating photo gallery:', error);
    return { success: false, error: 'Failed to create photo gallery item', validationErrors: (error as { flatten?: () => { fieldErrors: Record<string, string[]> } }).flatten?.().fieldErrors };
  }
}

/**
 * Update an existing photo gallery item
 */
export async function updatePhotoGallery(id: number, data: PhotoGalleryUpdate) {
  try {
    const validatedData = updatePhotoGallerySchema.parse(data);
    const result = await PhotoGalleryService.updateById(id, validatedData);
    RevalidationHelper.revalidatePhotoGallery();
    return result;
  } catch (error: unknown) {
    console.error(`Error updating photo gallery with ID ${id}:`, error);
    return { success: false, error: `Failed to update photo gallery item with ID ${id}`, validationErrors: (error as { flatten?: () => { fieldErrors: Record<string, string[]> } }).flatten?.().fieldErrors };
  }
}

/**
 * Delete a photo gallery item
 */
export async function deletePhotoGallery(id: number) {
  try {
    const result = await PhotoGalleryService.deleteById(id);
    RevalidationHelper.revalidatePhotoGallery();
    return result;
  } catch (error) {
    console.error(`Error deleting photo gallery with ID ${id}:`, error);
    return { success: false, error: `Failed to delete photo gallery item with ID ${id}` };
  }
}

'use server';

import { RevalidationHelper } from '@/lib/utils/revalidation';
import { HeroSectionService } from '@/services/hero-section';
import { HeroSectionLiveInsert, HeroSectionLiveUpdate, HeroSectionLivePaginationOptions } from '@/lib/types/hero-section';
import { createHeroSectionLiveSchema, updateHeroSectionLiveSchema } from '@/lib/validations/hero-section';

/**
 * Get paginated hero section live items
 */
export async function getPaginatedHeroSectionLive(options: HeroSectionLivePaginationOptions) {
  try {
    const result = await HeroSectionService.getPaginated(options);
    return result;
  } catch (error) {
    console.error('Error fetching paginated hero section live:', error);
    return { success: false, error: 'Failed to fetch hero section live items' };
  }
}

/**
 * Get all hero section live items
 */
export async function getAllHeroSectionLive() {
  try {
    const result = await HeroSectionService.getAll();
    return result;
  } catch (error) {
    console.error('Error fetching all hero section live:', error);
    return { success: false, error: 'Failed to fetch all hero section live items' };
  }
}

/**
 * Get current active hero section (for public display)
 */
export async function getCurrentActiveHeroSection() {
  try {
    const result = await HeroSectionService.getCurrentActive();
    return result;
  } catch (error) {
    console.error('Error fetching current active hero section:', error);
    return { success: false, error: 'Failed to fetch current active hero section' };
  }
}

/**
 * Get a single hero section live item by ID
 */
export async function getHeroSectionLiveById(id: number) {
  try {
    const result = await HeroSectionService.getById(id);
    return result;
  } catch (error) {
    console.error(`Error fetching hero section live with ID ${id}:`, error);
    return { success: false, error: `Failed to fetch hero section live item with ID ${id}` };
  }
}

/**
 * Create a new hero section live item
 */
export async function createHeroSectionLive(data: HeroSectionLiveInsert) {
  try {
    const validatedData = createHeroSectionLiveSchema.parse(data);
    const result = await HeroSectionService.insert(validatedData);
    RevalidationHelper.revalidateHeroSection();
    return result;
  } catch (error: unknown) {
    console.error('Error creating hero section live:', error);
    return { success: false, error: 'Failed to create hero section live item', validationErrors: (error as { flatten?: () => { fieldErrors: Record<string, string[]> } }).flatten?.().fieldErrors };
  }
}

/**
 * Update an existing hero section live item
 */
export async function updateHeroSectionLive(id: number, data: HeroSectionLiveUpdate) {
  try {
    const validatedData = updateHeroSectionLiveSchema.parse(data);
    const result = await HeroSectionService.updateById(id, validatedData);
    RevalidationHelper.revalidateHeroSection();
    return result;
  } catch (error: unknown) {
    console.error(`Error updating hero section live with ID ${id}:`, error);
    return { success: false, error: `Failed to update hero section live item with ID ${id}`, validationErrors: (error as { flatten?: () => { fieldErrors: Record<string, string[]> } }).flatten?.().fieldErrors };
  }
}

/**
 * Delete a hero section live item
 */
export async function deleteHeroSectionLive(id: number) {
  try {
    const result = await HeroSectionService.deleteById(id);
    RevalidationHelper.revalidateHeroSection();
    return result;
  } catch (error) {
    console.error(`Error deleting hero section live with ID ${id}:`, error);
    return { success: false, error: `Failed to delete hero section live item with ID ${id}` };
  }
}

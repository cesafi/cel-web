'use server';

import { RevalidationHelper } from '@/lib/utils/revalidation';
import { FaqService } from '@/services/faq';
import { FaqInsert, FaqUpdate, FaqPaginationOptions } from '@/lib/types/faq';
import { createFaqSchema, updateFaqSchema } from '@/lib/validations/faq';

/**
 * Get paginated FAQ items
 */
export async function getPaginatedFaq(options: FaqPaginationOptions) {
  try {
    const result = await FaqService.getPaginated(options);
    return result;
  } catch (error) {
    console.error('Error fetching paginated FAQ:', error);
    return { success: false, error: 'Failed to fetch FAQ items' };
  }
}

/**
 * Get all FAQ items (for public display)
 */
export async function getAllFaq() {
  try {
    const result = await FaqService.getAllActive();
    return result;
  } catch (error) {
    console.error('Error fetching all FAQ:', error);
    return { success: false, error: 'Failed to fetch FAQ items' };
  }
}

/**
 * Get highlighted FAQ items (for landing page)
 */
export async function getHighlightedFaq() {
  try {
    const result = await FaqService.getHighlighted();
    return result;
  } catch (error) {
    console.error('Error fetching highlighted FAQ:', error);
    return { success: false, error: 'Failed to fetch highlighted FAQ items' };
  }
}

/**
 * Get FAQ items for About Us page (General and Events categories)
 */
export async function getAboutUsFaq() {
  try {
    const result = await FaqService.getByCategories(['General', 'Events', 'Organization']);
    return result;
  } catch (error) {
    console.error('Error fetching About Us FAQ:', error);
    return { success: false, error: 'Failed to fetch About Us FAQ items' };
  }
}

/**
 * Get FAQ by ID
 */
export async function getFaqById(id: number) {
  try {
    const result = await FaqService.getById(id);
    return result;
  } catch (error) {
    console.error('Error fetching FAQ by ID:', error);
    return { success: false, error: 'Failed to fetch FAQ item' };
  }
}

/**
 * Create new FAQ item
 */
export async function createFaq(data: FaqInsert) {
  try {
    // Validate input
    const validatedData = createFaqSchema.parse(data);
    
    const faq = await FaqService.insert(validatedData);
    
    // Revalidate relevant paths
    RevalidationHelper.revalidateFAQ();
    
    return { success: true, data: faq };
  } catch (error) {
    console.error('Error creating FAQ:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create FAQ item' };
  }
}

/**
 * Update FAQ item
 */
export async function updateFaq(id: number, data: FaqUpdate) {
  try {
    // Validate input
    const validatedData = updateFaqSchema.parse(data);
    
    const faq = await FaqService.updateById(id, validatedData);
    
    // Revalidate relevant paths
    RevalidationHelper.revalidateFAQ();
    
    return { success: true, data: faq };
  } catch (error) {
    console.error('Error updating FAQ:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update FAQ item' };
  }
}

/**
 * Delete FAQ item
 */
export async function deleteFaq(id: number) {
  try {
    await FaqService.deleteById(id);
    
    // Revalidate relevant paths
    RevalidationHelper.revalidateFAQ();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return { success: false, error: 'Failed to delete FAQ item' };
  }
}

/**
 * Reorder FAQ items
 */
export async function reorderFaq(faqIds: number[]) {
  try {
    await FaqService.reorderFaq(faqIds);
    
    // Revalidate relevant paths
    RevalidationHelper.revalidateFAQ();
    
    return { success: true };
  } catch (error) {
    console.error('Error reordering FAQ:', error);
    return { success: false, error: 'Failed to reorder FAQ items' };
  }
}

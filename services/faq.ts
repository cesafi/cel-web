import {
    PaginatedResponse,
    ServiceResponse
} from '@/lib/types/base';
import { BaseService } from './base';
import { Faq, FaqPaginationOptions, FaqInsert, FaqUpdate } from '@/lib/types/faq';

const TABLE_NAME = 'faq';

export class FaqService extends BaseService {
    /**
     * Get paginated FAQ items with filtering and search
     */
    static async getPaginated(
        options: FaqPaginationOptions,
        selectQuery: string = '*'
    ): Promise<ServiceResponse<PaginatedResponse<Faq>>> {
        try {
            const searchableFields = ['question', 'answer'];
            const optionsWithSearchableFields = {
                ...options,
                searchableFields
            };

            const result = await this.getPaginatedData<Faq, 'faq'>(
                'faq',
                optionsWithSearchableFields,
                selectQuery
            );

            return result;
        } catch (err) {
            return this.formatError(err, `Failed to retrieve paginated FAQ items.`);
        }
    }

    /**
     * Get all FAQ items ordered by display_order
     */
    static async getAll(): Promise<ServiceResponse<Faq[]>> {
        try {
            const supabase = await this.getClient();
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select()
                .order('display_order', { ascending: true });

            if (error) {
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (err) {
            return this.formatError(err, `Failed to fetch all FAQ items.`);
        }
    }

    /**
     * Get all active FAQ items for public display
     */
    static async getAllActive(): Promise<ServiceResponse<Faq[]>> {
        try {
            const supabase = await this.getClient();
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select()
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) {
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (err) {
            return this.formatError(err, `Failed to fetch active FAQ items.`);
        }
    }

    /**
     * Get highlighted FAQ items for landing page display
     */
    static async getHighlighted(): Promise<ServiceResponse<Faq[]>> {
        try {
            const supabase = await this.getClient();
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select()
                .eq('is_active', true)
                .eq('is_highlight', true)
                .order('display_order', { ascending: true });

            if (error) {
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (err) {
            return this.formatError(err, `Failed to fetch highlighted FAQ items.`);
        }
    }

    /**
     * Get FAQ items by categories for About Us page
     */
    static async getByCategories(categories: string[]): Promise<ServiceResponse<Faq[]>> {
        try {
            const supabase = await this.getClient();
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select()
                .eq('is_active', true)
                .in('category', categories)
                .order('display_order', { ascending: true })
                .limit(6); // Limit to 6 items for About Us page

            if (error) {
                throw error;
            }

            return { success: true, data: data || [] };
        } catch (err) {
            return this.formatError(err, `Failed to fetch FAQ items by categories.`);
        }
    }

    /**
     * Get FAQ item by ID
     */
    static async getById(id: number): Promise<ServiceResponse<Faq>> {
        try {
            const supabase = await this.getClient();
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select()
                .eq('id', id)
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data };
        } catch (err) {
            return this.formatError(err, `Failed to fetch FAQ item.`);
        }
    }

    /**
     * Get count of FAQ items
     */
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
            return this.formatError(err, `Failed to get FAQ count.`);
        }
    }

    /**
     * Get the next available display order
     */
    static async getNextDisplayOrder(): Promise<ServiceResponse<number>> {
        try {
            const supabase = await this.getClient();
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('display_order')
                .order('display_order', { ascending: false })
                .limit(1);

            if (error) {
                throw error;
            }

            const maxOrder = data && data.length > 0 ? data[0].display_order : 0;
            return { success: true, data: maxOrder + 1 };
        } catch (err) {
            return this.formatError(err, `Failed to get next display order.`);
        }
    }

    /**
     * Insert new FAQ item
     */
    static async insert(data: FaqInsert): Promise<ServiceResponse<Faq>> {
        try {
            const supabase = await this.getClient();

            // If display_order is not provided, get the next available order
            const insertData = { ...data };
            if (!insertData.display_order) {
                const nextOrderResult = await this.getNextDisplayOrder();
                if (nextOrderResult.success) {
                    insertData.display_order = nextOrderResult.data;
                } else {
                    insertData.display_order = 1;
                }
            }

            const { data: insertedData, error } = await supabase
                .from(TABLE_NAME)
                .insert(insertData)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { success: true, data: insertedData };
        } catch (err) {
            return this.formatError(err, `Failed to insert new FAQ item.`);
        }
    }

    /**
     * Update FAQ item by ID
     */
    static async updateById(id: number, data: FaqUpdate): Promise<ServiceResponse<Faq>> {
        try {
            if (!id) {
                return { success: false, error: 'FAQ ID is required to update.' };
            }

            const supabase = await this.getClient();

            const updateData = {
                ...data,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from(TABLE_NAME)
                .update(updateData)
                .eq('id', id);

            if (error) {
                throw error;
            }

            // Fetch the updated FAQ item
            const { data: updatedFaq, error: fetchError } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            return { success: true, data: updatedFaq };
        } catch (err) {
            return this.formatError(err, `Failed to update FAQ item.`);
        }
    }

    /**
     * Delete FAQ item by ID
     */
    static async deleteById(id: number): Promise<ServiceResponse<undefined>> {
        try {
            if (!id) {
                return { success: false, error: 'FAQ ID is required to delete.' };
            }

            const supabase = await this.getClient();
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            return { success: true, data: undefined };
        } catch (err) {
            return this.formatError(err, `Failed to delete FAQ item.`);
        }
    }

    /**
     * Reorder FAQ items by updating display_order
     */
    static async reorderFaq(faqIds: number[]): Promise<ServiceResponse<undefined>> {
        try {
            const supabase = await this.getClient();

            // Update each FAQ item with its new display order
            const updates = faqIds.map((id, index) => ({
                id,
                display_order: index + 1,
                updated_at: new Date().toISOString()
            }));

            // Perform batch update
            for (const update of updates) {
                const { error } = await supabase
                    .from(TABLE_NAME)
                    .update({
                        display_order: update.display_order,
                        updated_at: update.updated_at
                    })
                    .eq('id', update.id);

                if (error) {
                    throw error;
                }
            }

            return { success: true, data: undefined };
        } catch (err) {
            return this.formatError(err, `Failed to reorder FAQ items.`);
        }
    }

    /**
     * Toggle FAQ item active status
     */
    static async toggleActive(id: number): Promise<ServiceResponse<Faq>> {
        try {
            if (!id) {
                return { success: false, error: 'FAQ ID is required to toggle active status.' };
            }

            const supabase = await this.getClient();

            // First get the current status
            const { data: currentFaq, error: fetchError } = await supabase
                .from(TABLE_NAME)
                .select('is_active')
                .eq('id', id)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            // Toggle the status
            const newStatus = !currentFaq.is_active;
            const { error } = await supabase
                .from(TABLE_NAME)
                .update({
                    is_active: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                throw error;
            }

            // Fetch the updated FAQ item
            const { data: updatedFaq, error: updatedFetchError } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .eq('id', id)
                .single();

            if (updatedFetchError) {
                throw updatedFetchError;
            }

            return { success: true, data: updatedFaq };
        } catch (err) {
            return this.formatError(err, `Failed to toggle FAQ active status.`);
        }
    }

    /**
     * Bulk update FAQ items active status
     */
    static async bulkUpdateActive(ids: number[], isActive: boolean): Promise<ServiceResponse<undefined>> {
        try {
            if (!ids || ids.length === 0) {
                return { success: false, error: 'FAQ IDs are required for bulk update.' };
            }

            const supabase = await this.getClient();

            const { error } = await supabase
                .from(TABLE_NAME)
                .update({
                    is_active: isActive,
                    updated_at: new Date().toISOString()
                })
                .in('id', ids);

            if (error) {
                throw error;
            }

            return { success: true, data: undefined };
        } catch (err) {
            return this.formatError(err, `Failed to bulk update FAQ items.`);
        }
    }
}
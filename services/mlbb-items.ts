// Service class for mlbb_items table operations

import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { MlbbItem, MlbbItemInsert, MlbbItemUpdate } from '@/lib/types/mlbb-items';

const TABLE_NAME = 'mlbb_items';

export class MlbbItemService extends BaseService {
  static async getAll(): Promise<ServiceResponse<MlbbItem[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME}.`);
    }
  }

  static async getActive(): Promise<ServiceResponse<MlbbItem[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch active items.`);
    }
  }

  static async getById(id: number): Promise<ServiceResponse<MlbbItem>> {
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
      return this.formatError(err, `Failed to fetch item by ID.`);
    }
  }

  static async insert(item: MlbbItemInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(item);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create item.`);
    }
  }

  static async updateById(item: MlbbItemUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = item;
      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id!);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update item.`);
    }
  }

  static async deleteById(id: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete item.`);
    }
  }
}

// Service class for valorant_maps table operations

import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { ValorantMap, ValorantMapInsert, ValorantMapUpdate } from '@/lib/types/valorant-maps';

const TABLE_NAME = 'valorant_maps';

export class ValorantMapService extends BaseService {
  static async getAll(): Promise<ServiceResponse<ValorantMap[]>> {
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

  static async getActive(): Promise<ServiceResponse<ValorantMap[]>> {
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
      return this.formatError(err, `Failed to fetch active maps.`);
    }
  }

  static async getById(id: number): Promise<ServiceResponse<ValorantMap>> {
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
      return this.formatError(err, `Failed to fetch map by ID.`);
    }
  }

  static async insert(map: ValorantMapInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(map);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create map.`);
    }
  }

  static async updateById(map: ValorantMapUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = map;
      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id!);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update map.`);
    }
  }

  static async deleteById(id: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete map.`);
    }
  }
}

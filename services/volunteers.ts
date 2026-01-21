// Service class for volunteers table operations

import {
  ServiceResponse
} from '@/lib/types/base';
import { BaseService } from './base';
import { Volunteer, VolunteerInsert, VolunteerUpdate } from '@/lib/types/volunteers';

const TABLE_NAME = 'volunteers';

export interface VolunteerWithDetails extends Volunteer {
  departments: {
    id: number;
    name: string;
  } | null;
  seasons: {
    id: number;
    start_at: string;
    end_at: string;
  } | null;
}

export class VolunteerService extends BaseService {
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
      return this.formatError(err, `Failed to count ${TABLE_NAME}`);
    }
  }

  static async getAll(): Promise<ServiceResponse<Volunteer[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .order('full_name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all volunteers.`);
    }
  }

  static async getAllWithDetails(): Promise<ServiceResponse<VolunteerWithDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, departments(id, name), seasons(id, start_at, end_at)')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return { success: true, data: data as unknown as VolunteerWithDetails[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch volunteers with details.`);
    }
  }

  static async getBySeasonId(seasonId: number): Promise<ServiceResponse<VolunteerWithDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, departments(id, name), seasons(id, start_at, end_at)')
        .eq('season_id', seasonId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return { success: true, data: data as unknown as VolunteerWithDetails[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch volunteers by season.`);
    }
  }

  static async getByDepartmentId(departmentId: number): Promise<ServiceResponse<VolunteerWithDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, departments(id, name), seasons(id, start_at, end_at)')
        .eq('department_id', departmentId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return { success: true, data: data as unknown as VolunteerWithDetails[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch volunteers by department.`);
    }
  }

  static async getById(id: string): Promise<ServiceResponse<VolunteerWithDetails>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, departments(id, name), seasons(id, start_at, end_at)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data: data as unknown as VolunteerWithDetails };
    } catch (err) {
      return this.formatError(err, `Failed to fetch volunteer by ID.`);
    }
  }

  static async insert(volunteer: VolunteerInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(volunteer);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create volunteer.`);
    }
  }

  static async updateById(volunteer: VolunteerUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = volunteer;
      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id!);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update volunteer.`);
    }
  }

  static async deleteById(id: string): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete volunteer.`);
    }
  }
}

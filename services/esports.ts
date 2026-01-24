import {
  ServiceResponse
} from '@/lib/types/base';
import { BaseService } from './base';
import { Esport, EsportCategoryWithEsport, EsportInsert, EsportUpdate } from '@/lib/types/esports';

const TABLE_NAME = 'esports';
const CATEGORIES_TABLE_NAME = 'esports_categories';

export class EsportsService extends BaseService {
  static async getAll(): Promise<ServiceResponse<Esport[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return { success: true, data: data as Esport[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME}`);
    }
  }

  static async getById(id: number): Promise<ServiceResponse<Esport>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: data as Esport };
    } catch (err) {
      return this.formatError(err, `Failed to fetch esport with id ${id}`);
    }
  }

  static async create(esportData: EsportInsert): Promise<ServiceResponse<Esport>> {
    try {
      const supabase = await this.getAdminClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(esportData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: data as Esport };
    } catch (err) {
      return this.formatError(err, 'Failed to create esport');
    }
  }

  static async update(id: number, esportData: EsportUpdate): Promise<ServiceResponse<Esport>> {
    try {
      const supabase = await this.getAdminClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ ...esportData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: data as Esport };
    } catch (err) {
      return this.formatError(err, `Failed to update esport with id ${id}`);
    }
  }

  static async delete(id: number): Promise<ServiceResponse<void>> {
    try {
      const supabase = await this.getAdminClient();
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete esport with id ${id}`);
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
      return this.formatError(err, `Failed to count ${TABLE_NAME}`);
    }
  }

  static async getAllCategories(): Promise<ServiceResponse<EsportCategoryWithEsport[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(CATEGORIES_TABLE_NAME)
        .select(`
          *,
          esports (
            *
          )
        `)
        .order('esport_id');

      if (error) {
        throw error;
      }

      // Filter out any categories where the parent esport might be null (though unlikely with FKs)
      const validData = (data || []).map(item => item as unknown as EsportCategoryWithEsport);

      return { success: true, data: validData };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all esports categories`);
    }
  }

  static async createCategory(categoryData: { esport_id: number; division: string; levels: string }): Promise<ServiceResponse<EsportCategoryWithEsport>> {
    try {
      const supabase = await this.getAdminClient();
      const { data, error } = await supabase
        .from(CATEGORIES_TABLE_NAME)
        .insert(categoryData)
        .select(`
          *,
          esports (*)
        `)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: data as unknown as EsportCategoryWithEsport };
    } catch (err) {
      return this.formatError(err, 'Failed to create esport category');
    }
  }

  static async updateCategory(id: number, categoryData: { esport_id?: number; division?: string; levels?: string }): Promise<ServiceResponse<EsportCategoryWithEsport>> {
    try {
      const supabase = await this.getAdminClient();
      const { data, error } = await supabase
        .from(CATEGORIES_TABLE_NAME)
        .update({ ...categoryData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          esports (*)
        `)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: data as unknown as EsportCategoryWithEsport };
    } catch (err) {
      return this.formatError(err, `Failed to update esport category with id ${id}`);
    }
  }

  static async deleteCategory(id: number): Promise<ServiceResponse<void>> {
    try {
      const supabase = await this.getAdminClient();
      const { error } = await supabase
        .from(CATEGORIES_TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete esport category with id ${id}`);
    }
  }
}


import {
  ServiceResponse
} from '@/lib/types/base';
import { BaseService } from './base';
import { Esport, EsportCategoryWithEsport } from '@/lib/types/esports';

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
}

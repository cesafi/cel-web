import {
  ServiceResponse
} from '@/lib/types/base';
import { BaseService } from './base';
import { EsportsSeasonStage, EsportsSeasonStageWithDetails } from '@/lib/types/esports-seasons-stages';

const TABLE_NAME = 'esports_seasons_stages';

export class EsportsSeasonsStagesService extends BaseService {
  static async getAll(): Promise<ServiceResponse<EsportsSeasonStageWithDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          esports_categories (
            *,
            esports (
              *
            )
          )
        `);

      if (error) {
        throw error;
      }

      // Supabase returns nested objects, we need to cast them to our type
      // The types from database.types.ts might not perfectly match the nested response structure immediately
      // so we use unknown cast here for safety, or we could define the response type more strictly.
      const typedData = data as unknown as EsportsSeasonStageWithDetails[];

      return { success: true, data: typedData };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME}`);
    }
  }
}

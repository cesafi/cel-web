import {
  ServiceResponse
} from '@/lib/types/base';
import { BaseService } from './base';
import { EsportsSeasonStageWithDetails } from '@/lib/types/esports-seasons-stages';
import { Database } from '@/database.types';

const TABLE_NAME = 'esports_seasons_stages';

type EsportsSeasonStageInsert = Database['public']['Tables']['esports_seasons_stages']['Insert'];
type EsportsSeasonStageUpdate = Database['public']['Tables']['esports_seasons_stages']['Update'];
type EsportsSeasonStage = Database['public']['Tables']['esports_seasons_stages']['Row'];

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
        `)
        .order('season_id', { ascending: false });

      if (error) {
        throw error;
      }

      const typedData = data as unknown as EsportsSeasonStageWithDetails[];
      return { success: true, data: typedData };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME}`);
    }
  }

  static async create(stageData: EsportsSeasonStageInsert): Promise<ServiceResponse<EsportsSeasonStage>> {
    try {
      const supabase = await this.getAdminClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(stageData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      console.error('Create Stage Error:', err);
      // Return the specific error message to help debugging
      return this.formatError(err, err instanceof Error ? err.message : 'Failed to create league stage');
    }
  }

  static async update(id: number, stageData: EsportsSeasonStageUpdate): Promise<ServiceResponse<EsportsSeasonStage>> {
    try {
      const supabase = await this.getAdminClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(stageData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, 'Failed to update league stage');
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
      return this.formatError(err, 'Failed to delete league stage');
    }
  }
}


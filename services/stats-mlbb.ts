
import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { 
  StatsMlbbGamePlayer, 
  StatsMlbbGamePlayerInsert, 
  StatsMlbbGamePlayerUpdate,
  StatsMlbbGamePlayerWithDetails
} from '@/lib/types/stats-mlbb';

const TABLE_NAME = 'stats_mlbb_game_player';

export class StatsMlbbService extends BaseService {
  static async getByGameId(gameId: number): Promise<ServiceResponse<StatsMlbbGamePlayerWithDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          players (
            id,
            ign,
            first_name,
            last_name,
            photo_url,
            role
          ),
          schools_teams (
            id,
            name,
            schools (
              id,
              name,
              abbreviation,
              logo_url
            )
          )
        `)
        .eq('game_id', gameId);

      if (error) throw error;
      return { success: true, data: data as unknown as StatsMlbbGamePlayerWithDetails[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch stats for game.`);
    }
  }

  static async insert(stats: StatsMlbbGamePlayerInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(stats);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to insert stats.`);
    }
  }

  static async insertMany(stats: StatsMlbbGamePlayerInsert[]): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(stats);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to insert multiple stats.`);
    }
  }

  static async updateById(id: string, stats: StatsMlbbGamePlayerUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).update(stats).eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update stats.`);
    }
  }

  static async deleteById(id: string): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete stats.`);
    }
  }

  static async deleteByGameId(gameId: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('game_id', gameId);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete stats for game.`);
    }
  }
}

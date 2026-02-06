import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { Database } from '@/database.types';

// Types
export type StatsMlbbPlayer = Database['public']['Tables']['stats_mlbb_game_player']['Insert'];
export type StatsValorantPlayer = Database['public']['Tables']['stats_valorant_game_player']['Insert'];

export class PostGameStatsService extends BaseService {
  /**
   * Bulk insert MLBB player stats for a game.
   * This should usually clear existing stats for the game first to avoid duplicates if re-uploading.
   */
  static async saveMlbbStats(gameId: number, stats: StatsMlbbPlayer[]): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      
      // Transaction-like approach: Delete existing -> Insert new
      // Note: Actual transactions are not directly supported via client lib in one go without RPC, 
      // but simple sequential ops work for this scale.

      // 1. Delete existing stats for this game
      const { error: deleteError } = await supabase
        .from('stats_mlbb_game_player')
        .delete()
        .eq('game_id', gameId);

      if (deleteError) throw deleteError;

      // 2. Insert new stats
      const { error: insertError } = await supabase
        .from('stats_mlbb_game_player')
        .insert(stats);

      if (insertError) throw insertError;

      return { success: true, data: undefined };

    } catch (err) {
      return this.formatError(err, 'Failed to save MLBB stats');
    }
  }

  /**
   * Bulk insert Valorant player stats for a game.
   */
  static async saveValorantStats(gameId: number, stats: StatsValorantPlayer[]): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      
      // 1. Delete existing stats for this game
      const { error: deleteError } = await supabase
        .from('stats_valorant_game_player')
        .delete()
        .eq('game_id', gameId);

      if (deleteError) throw deleteError;

      // 2. Insert new stats
      const { error: insertError } = await supabase
        .from('stats_valorant_game_player')
        .insert(stats);

      if (insertError) throw insertError;

      return { success: true, data: undefined };

    } catch (err) {
      return this.formatError(err, 'Failed to save Valorant stats');
    }
  }
}

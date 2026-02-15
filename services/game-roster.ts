import { BaseService } from './base';
import { ServiceResponse } from '@/lib/types/base';
import { Database } from '@/database.types';

type GameRoster = Database['public']['Tables']['game_rosters']['Row'];
type GameRosterInsert = Database['public']['Tables']['game_rosters']['Insert'];

const TABLE_NAME = 'game_rosters';

export class GameRosterService extends BaseService {
  /**
   * Fetch all roster entries for a specific game.
   */
  static async getByGameId(gameId: number): Promise<ServiceResponse<GameRoster[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
            *,
            player:players(id, ign, role, photo_url)
        `)
        .eq('game_id', gameId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return { success: true, data: data as any[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch game rosters.`);
    }
  }

  /**
   * Upsert a roster entry (assign a player to a specific slot).
   */
  static async upsert(roster: GameRosterInsert): Promise<ServiceResponse<GameRoster>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .upsert(roster, { onConflict: 'game_id, team_id, sort_order' })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to update roster entry.`);
    }
  }
}

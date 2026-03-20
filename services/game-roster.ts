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

  /**
   * Remove a roster entry (unassign a player from a specific slot).
   */
  static async deleteBySlot(gameId: number, teamId: string, sortOrder: number): Promise<ServiceResponse<void>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .match({ game_id: gameId, team_id: teamId, sort_order: sortOrder });

      if (error) throw error;
      return { success: true, data: undefined as any };
    } catch (err) {
      return this.formatError(err, `Failed to remove roster entry.`);
    }
  }

  /**
   * Auto-fill roster from Game 1 of the same match
   */
  static async autoFillFromGame1(currentGameId: number, matchId: number): Promise<ServiceResponse<void>> {
    try {
      const supabase = await this.getClient();

      // Get Game 1 ID
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, game_number')
        .eq('match_id', matchId)
        .order('game_number', { ascending: true });

      if (gamesError) throw gamesError;
      if (!games || games.length === 0) return { success: false, error: 'No games found for this match' };

      const game1 = games.find(g => g.game_number === 1);
      if (!game1) return { success: false, error: 'Game 1 not found' };
      if (game1.id === currentGameId) return { success: false, error: 'Cannot auto-fill Game 1 from itself' };

      // Get Game 1 roster
      const { data: game1Roster, error: rosterError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('game_id', game1.id);

      if (rosterError) throw rosterError;
      if (!game1Roster || game1Roster.length === 0) return { success: false, error: 'Game 1 roster is empty' };

      // Delete existing roster for current game first
      const { error: deleteError } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('game_id', currentGameId);

      if (deleteError) throw deleteError;

      // Duplicate roster for current game (only copy the necessary fields)
      const newRoster = game1Roster.map(r => ({
        game_id: currentGameId,
        team_id: r.team_id,
        player_id: r.player_id,
        player_role: r.player_role,
        sort_order: r.sort_order,
      }));

      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert(newRoster);

      if (insertError) throw insertError;

      return { success: true, data: undefined as any };
    } catch (err) {
      return this.formatError(err, `Failed to auto-fill roster from Game 1.`);
    }
  }

  /**
   * Swap players between two roster slots (exchange player_id values).
   * Roles are fixed to slot positions — only player_id moves.
   * If slotRoleA / slotRoleB are provided, re-stamp each slot's player_role.
   */
  static async swapSlots(
    gameId: number,
    teamId: string,
    sortOrderA: number,
    sortOrderB: number,
    slotRoleA?: string,
    slotRoleB?: string
  ): Promise<ServiceResponse<void>> {
    try {
      const supabase = await this.getClient();

      // Fetch both roster entries
      const { data: entries, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('game_id', gameId)
        .eq('team_id', teamId)
        .in('sort_order', [sortOrderA, sortOrderB]);

      if (fetchError) throw fetchError;
      if (!entries || entries.length !== 2) {
        return { success: false, error: 'Both slots must have players assigned to swap.' };
      }

      const entryA = entries.find(e => e.sort_order === sortOrderA)!;
      const entryB = entries.find(e => e.sort_order === sortOrderB)!;

      // Swap player_id only; re-stamp player_role to the slot's correct label
      const { error: updateA } = await supabase
        .from(TABLE_NAME)
        .update({ player_id: entryB.player_id, ...(slotRoleA ? { player_role: slotRoleA } : {}) })
        .match({ game_id: gameId, team_id: teamId, sort_order: sortOrderA });

      if (updateA) throw updateA;

      const { error: updateB } = await supabase
        .from(TABLE_NAME)
        .update({ player_id: entryA.player_id, ...(slotRoleB ? { player_role: slotRoleB } : {}) })
        .match({ game_id: gameId, team_id: teamId, sort_order: sortOrderB });

      if (updateB) throw updateB;

      return { success: true, data: undefined as any };
    } catch (err) {
      return this.formatError(err, `Failed to swap player slots.`);
    }
  }
}

// Service class for game_draft_actions table operations
// Handles both Bans and Picks in a unified stream

import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { GameDraftAction, GameDraftActionInsert, GameDraftActionUpdate } from '@/lib/types/game-draft';

const TABLE_NAME = 'game_draft_actions';

export class GameDraftService extends BaseService {
  /**
   * Fetch all draft actions for a specific game, ordered by sequence,
   * including related team and hero details.
   */
  static async getByGameId(gameId: number): Promise<ServiceResponse<GameDraftAction[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          schools_teams(id, name, schools(id, name, abbreviation, logo_url)),
          player:players(id, ign, role)
        `)
        .eq('game_id', gameId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return { success: true, data: data as unknown as GameDraftAction[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch draft actions for game.`);
    }
  }

  /**
   * Submit a new draft action (Ban or Pick).
   * Validates sequencing should ideally happen either here or via DB constraints,
   * but for now we rely on the UI/API to send the correct sort_order.
   */
  static async insert(action: GameDraftActionInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(action);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to list draft action.`);
    }
  }

  /**
   * Reset the draft by removing all actions for a game.
   */
  static async resetDraft(gameId: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('game_id', gameId);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to reset draft.`);
    }
  }

  /**
   * Undo the last draft action by deleting the one with the highest sort_order.
   */
  static async undoLastAction(gameId: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      
      // 1. Get the last action (highest sort_order)
      const { data: lastActions, error: fetchError } = await supabase
          .from(TABLE_NAME)
          .select('id')
          .eq('game_id', gameId)
          .order('sort_order', { ascending: false })
          .limit(1);

      if (fetchError) throw fetchError;
      if (!lastActions || lastActions.length === 0) {
          return { success: false, error: 'No actions to undo.' };
      }

      const lastActionId = lastActions[0].id;

      // 2. Delete it
      const { error: deleteError } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', lastActionId);

      if (deleteError) throw deleteError;

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to undo last action.`);
    }
  }

  /**
   * Lock a specific action (if we use a lock-in mechanism separately from insert).
   */
  static async lockAction(actionId: string): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ is_locked: true })
        .eq('id', actionId);
      
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to lock action.`);
    }
  }

  /**
   * Update an existing draft action (e.g. swapping a picked/banned character).
   */
  static async updateAction(actionId: string, data: Partial<GameDraftActionUpdate>): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase
        .from(TABLE_NAME)
        .update(data)
        .eq('id', actionId);
      
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update action.`);
    }
  }
}

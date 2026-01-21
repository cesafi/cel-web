import {
  ServiceResponse
} from '@/lib/types/base';
import { BaseService } from './base';
import { GameScore, GameScoreInsert, GameScoreUpdate } from '@/lib/types/game-scores';
import { nowUtc } from '@/lib/utils/utc-time';

const TABLE_NAME = 'game_scores';

export class GameScoreService extends BaseService {
  static async getByGameId(gameId: number): Promise<ServiceResponse<GameScore[]>> {
    try {
      if (!gameId) {
        return { success: true, data: [] };
      }

      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('game_id', gameId);

      if (error) {
        throw error;
      }

      return { success: true, data: data as GameScore[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch scores for game ${gameId}`);
    }
  }

  static async insert(data: GameScoreInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();

      const { error } = await supabase.from(TABLE_NAME).insert({
        ...data,
        created_at: nowUtc(),
        updated_at: nowUtc()
      });

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to insert new ${TABLE_NAME} entity.`);
    }
  }

  static async updateById(data: GameScoreUpdate): Promise<ServiceResponse<undefined>> {
    try {
      if (!data.id) {
        return { success: false, error: 'Entity ID is required to update.' };
      }

      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).update({
        ...data,
        updated_at: nowUtc()
      }).eq('id', data.id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update ${TABLE_NAME} entity.`);
    }
  }
}

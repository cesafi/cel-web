// Service class for game_hero_bans table operations

import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { GameHeroBan, GameHeroBanInsert, GameHeroBanUpdate, GameHeroBanWithTeam } from '@/lib/types/game-hero-bans';

const TABLE_NAME = 'game_hero_bans';

export class GameHeroBanService extends BaseService {
  static async getByGameId(gameId: number): Promise<ServiceResponse<GameHeroBanWithTeam[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, schools_teams(id, name, schools(id, name, abbreviation, logo_url))')
        .eq('game_id', gameId)
        .order('ban_order', { ascending: true });

      if (error) throw error;
      return { success: true, data: data as unknown as GameHeroBanWithTeam[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch bans for game.`);
    }
  }

  static async getById(id: string): Promise<ServiceResponse<GameHeroBan>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch ban by ID.`);
    }
  }

  static async insert(ban: GameHeroBanInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(ban);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create ban.`);
    }
  }

  static async insertMany(bans: GameHeroBanInsert[]): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(bans);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create bans.`);
    }
  }

  static async updateById(ban: GameHeroBanUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = ban;
      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id!);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update ban.`);
    }
  }

  static async deleteById(id: string): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete ban.`);
    }
  }

  static async deleteByGameId(gameId: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('game_id', gameId);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete bans for game.`);
    }
  }
}

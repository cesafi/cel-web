// Service class for player_seasons table operations

import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { PlayerSeason, PlayerSeasonInsert, PlayerSeasonUpdate, PlayerSeasonWithDetails } from '@/lib/types/player-seasons';

const TABLE_NAME = 'player_seasons';

export class PlayerSeasonService extends BaseService {
  static async getAll(): Promise<ServiceResponse<PlayerSeason[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME}.`);
    }
  }

  static async getBySeasonId(seasonId: number): Promise<ServiceResponse<PlayerSeasonWithDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, players(id, ign, first_name, last_name, photo_url, role), seasons(id, name, start_at, end_at), schools_teams(id, name, schools(id, name, abbreviation, logo_url))')
        .eq('season_id', seasonId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data as unknown as PlayerSeasonWithDetails[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch player seasons.`);
    }
  }

  static async getByPlayerId(playerId: string): Promise<ServiceResponse<PlayerSeasonWithDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, players(id, ign, first_name, last_name, photo_url, role), seasons(id, name, start_at, end_at), schools_teams(id, name, schools(id, name, abbreviation, logo_url))')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data as unknown as PlayerSeasonWithDetails[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch player seasons.`);
    }
  }

  static async getById(id: number): Promise<ServiceResponse<PlayerSeasonWithDetails>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, players(id, ign, first_name, last_name, photo_url, role), seasons(id, name, start_at, end_at), schools_teams(id, name, schools(id, name, abbreviation, logo_url))')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data: data as unknown as PlayerSeasonWithDetails };
    } catch (err) {
      return this.formatError(err, `Failed to fetch player season by ID.`);
    }
  }

  static async insert(playerSeason: PlayerSeasonInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(playerSeason);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create player season.`);
    }
  }

  static async updateById(playerSeason: PlayerSeasonUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = playerSeason;
      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id!);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update player season.`);
    }
  }

  static async deleteById(id: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete player season.`);
    }
  }
}

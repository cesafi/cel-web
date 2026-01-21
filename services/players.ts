// Service class for players table operations

import {
  PaginatedResponse,
  PaginationOptions,
  ServiceResponse,
  FilterValue
} from '@/lib/types/base';
import { BaseService } from './base';
import { Player, PlayerInsert, PlayerUpdate, PlayerWithTeam } from '@/lib/types/players';

const TABLE_NAME = 'players';

export class PlayerService extends BaseService {
  static async getPaginated(
    options: PaginationOptions<Record<string, FilterValue>>,
    selectQuery: string = '*, schools_teams(id, name, school_id, schools(id, name, abbreviation, logo_url))'
  ): Promise<ServiceResponse<PaginatedResponse<PlayerWithTeam>>> {
    try {
      const searchableFields = ['ign', 'first_name', 'last_name'];
      const optionsWithSearchableFields = {
        ...options,
        searchableFields
      };

      const result = await this.getPaginatedData<PlayerWithTeam, 'players', Record<string, FilterValue>>(
        'players',
        optionsWithSearchableFields,
        selectQuery
      );

      return result;
    } catch (err) {
      return this.formatError(err, `Failed to retrieve paginated players`);
    }
  }

  static async getAll(): Promise<ServiceResponse<Player[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .order('ign', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data: data as Player[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME}.`);
    }
  }

  static async getAllWithTeams(): Promise<ServiceResponse<PlayerWithTeam[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, schools_teams(id, name, school_id, schools(id, name, abbreviation, logo_url))')
        .order('ign', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data: data as unknown as PlayerWithTeam[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all players with teams.`);
    }
  }

  static async getByTeamId(teamId: string): Promise<ServiceResponse<Player[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('team_id', teamId)
        .order('ign', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data: data as Player[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch players by team.`);
    }
  }

  static async getActivePlayers(): Promise<ServiceResponse<Player[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('is_active', true)
        .order('ign', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch active players.`);
    }
  }

  static async getCount(): Promise<ServiceResponse<number>> {
    try {
      const supabase = await this.getClient();
      const { count, error } = await supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return { success: true, data: count || 0 };
    } catch (err) {
      return this.formatError(err, `Failed to get player count.`);
    }
  }

  static async getById(id: string): Promise<ServiceResponse<PlayerWithTeam>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, schools_teams(id, name, school_id, schools(id, name, abbreviation, logo_url))')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: data as unknown as PlayerWithTeam };
    } catch (err) {
      return this.formatError(err, `Failed to fetch player by ID.`);
    }
  }

  static async insert(player: PlayerInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(player);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create player.`);
    }
  }

  static async updateById(player: PlayerUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = player;
      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update player.`);
    }
  }

  static async deleteById(id: string): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete player.`);
    }
  }
}

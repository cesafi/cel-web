// Service class for valorant_map_vetoes table operations

import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { ValorantMapVeto, ValorantMapVetoInsert, ValorantMapVetoUpdate, ValorantMapVetoWithTeam } from '@/lib/types/valorant-map-vetoes';

const TABLE_NAME = 'valorant_map_vetoes';

export class ValorantMapVetoService extends BaseService {
  static async getByMatchId(matchId: number): Promise<ServiceResponse<ValorantMapVetoWithTeam[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, schools_teams(id, name, schools(id, name, abbreviation, logo_url))')
        .eq('match_id', matchId)
        .order('sequence_order', { ascending: true });

      if (error) throw error;
      return { success: true, data: data as unknown as ValorantMapVetoWithTeam[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch vetoes for match.`);
    }
  }

  static async getById(id: string): Promise<ServiceResponse<ValorantMapVeto>> {
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
      return this.formatError(err, `Failed to fetch veto by ID.`);
    }
  }

  static async insert(veto: ValorantMapVetoInsert): Promise<ServiceResponse<undefined>> {
    try {
      // Use Admin Client to bypass RLS because this is triggered by anonymous public users 
      // (team captains) via Server Actions that handle the logic/validation.
      const supabase = await this.getAdminClient();
      const { error } = await supabase.from(TABLE_NAME).insert(veto);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create veto.`);
    }
  }

  static async insertMany(vetoes: ValorantMapVetoInsert[]): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(vetoes);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create vetoes.`);
    }
  }

  static async updateById(veto: ValorantMapVetoUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = veto;
      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id!);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update veto.`);
    }
  }

  static async deleteById(id: string): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete veto.`);
    }
  }

  static async deleteByMatchId(matchId: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).delete().eq('match_id', matchId);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete vetoes for match.`);
    }
  }
}

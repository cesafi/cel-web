// Service class for game_characters table operations

import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { GameCharacter, GameCharacterInsert, GameCharacterUpdate, GameCharacterWithEsport } from '@/lib/types/game-characters';
import CloudinaryService, { extractCloudinaryPublicId } from './cloudinary';

const TABLE_NAME = 'game_characters';

export class GameCharacterService extends BaseService {
  static async getAll(): Promise<ServiceResponse<GameCharacter[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME}.`);
    }
  }

  static async getAllWithEsport(): Promise<ServiceResponse<GameCharacterWithEsport[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*, esports(id, name)')
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data: data as unknown as GameCharacterWithEsport[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch characters with esports.`);
    }
  }

  static async getByEsportId(esportId: number): Promise<ServiceResponse<GameCharacter[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('esport_id', esportId)
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch characters by esport.`);
    }
  }

  static async getById(id: number): Promise<ServiceResponse<GameCharacter>> {
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
      return this.formatError(err, `Failed to fetch character by ID.`);
    }
  }

  static async insert(character: GameCharacterInsert): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.from(TABLE_NAME).insert(character);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to create character.`);
    }
  }

  static async updateById(character: GameCharacterUpdate): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = character;
      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id!);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update character.`);
    }
  }

  static async deleteById(id: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();

      // Fetch icon URL before deleting
      const { data: character, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('icon_url')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from Cloudinary if icon exists
      if (character?.icon_url) {
        try {
          const publicId = extractCloudinaryPublicId(character.icon_url);
          if (publicId) {
            await CloudinaryService.deleteImage(publicId, { resourceType: 'image' });
          }
        } catch (cloudinaryError) {
          console.warn('Failed to delete character icon from Cloudinary:', cloudinaryError);
        }
      }

      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete character.`);
    }
  }
}

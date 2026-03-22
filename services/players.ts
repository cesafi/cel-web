// Service class for players table operations

import {
  PaginatedResponse,
  PaginationOptions,
  ServiceResponse,
  FilterValue
} from '@/lib/types/base';
import { BaseService } from './base';
import { Player, PlayerInsert, PlayerUpdate, PlayerWithTeam } from '@/lib/types/players';
import CloudinaryService, { extractCloudinaryPublicId } from './cloudinary';

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
      // Since team_id is removed from players, we fetch the team from player_seasons
      // We take the latest season or just the first one found for now.
      // Ideally this should filter by current active season if available.
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
            *,
            player_seasons(
                team:schools_teams(
                    id, 
                    name, 
                    school_id, 
                    season_id,
                    esport_category_id,
                    esports_categories(
                        id,
                        esports(id, name)
                    ),
                    schools(id, name, abbreviation, logo_url)
                )
            )
        `)
        .order('ign', { ascending: true });

      if (error) {
        throw error;
      }

      // Transform to match PlayerWithTeam interface
      const playersWithTeam = data.map((p: any) => {
        // Get the first team from player_seasons (assuming one active team per context or just showing latest)
        // In reality, a player might have multiple seasons. We might want to sort player_seasons by created_at desc.
        // For now, we take the first one returned.
        const team = p.player_seasons?.[0]?.team || null;
        return {
          ...p,
          schools_teams: team
        };
      });

      return { success: true, data: playersWithTeam as unknown as PlayerWithTeam[] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all players with teams.`);
    }
  }

  static async getByTeamId(teamId: string): Promise<ServiceResponse<Player[]>> {
    try {
      const supabase = await this.getClient();

      // Query player_seasons to get players linked to this team
      // joining with players table to get player details
      const { data, error } = await supabase
        .from('player_seasons')
        .select(`
            player_role,
            is_team_captain,
            player:players!player_seasons_player_id_fkey(*)
        `)
        .eq('team_id', teamId);

      if (error) {
        throw error;
      }

      // Map result to just return the player objects
      // We override the player's legacy 'role' with the season-specific 'player_role'
      const players = data
        .map((item: any) => {
          if (!item.player) return null;
          return {
            ...item.player,
            role: item.player_role,
            is_team_captain: item.is_team_captain
          };
        })
        .filter((p: any) => p !== null)
        .sort((a: any, b: any) => a.ign.localeCompare(b.ign));

      return { success: true, data: players as Player[] };
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
        .select(`
            *,
            player_seasons(
                team:schools_teams(id, name, school_id, schools(id, name, abbreviation, logo_url))
            )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      const team = (data as any).player_seasons?.[0]?.team || null;
      const playerWithTeam = {
        ...data,
        schools_teams: team
      };

      return { success: true, data: playerWithTeam as unknown as PlayerWithTeam };
    } catch (err) {
      return this.formatError(err, `Failed to fetch player by ID.`);
    }
  }

  /**
   * Find a player by slugified IGN and school abbreviation (for clean URLs)
   * Matches "syv-god" to "SYV GOD" etc.
   */
  static async getByIgnAndSchool(playerSlug: string, schoolAbbreviation: string): Promise<ServiceResponse<PlayerWithTeam>> {
    try {
      const supabase = await this.getClient();
      const { ignMatchesSlug } = await import('@/lib/utils/player-slug');

      // Fetch all players with their team/school data
      const { data: allPlayers, error } = await supabase
        .from(TABLE_NAME)
        .select(`
            *,
            player_seasons(
                team:schools_teams(id, name, school_id, schools(id, name, abbreviation, logo_url))
            )
        `);

      if (error) throw error;
      if (!allPlayers || allPlayers.length === 0) {
        return { success: false, error: 'Player not found' };
      }

      // Find the player whose slugified IGN matches AND belongs to this school
      const match = allPlayers.find((p: any) => {
        if (!p.ign || !ignMatchesSlug(p.ign, playerSlug)) return false;
        const seasons = p.player_seasons || [];
        return seasons.some((ps: any) =>
          ps.team?.schools?.abbreviation?.toLowerCase() === schoolAbbreviation.toLowerCase()
        );
      });

      if (!match) {
        // Fall back: match just by slug, ignoring school
        const fallback = allPlayers.find((p: any) => p.ign && ignMatchesSlug(p.ign, playerSlug));
        if (!fallback) {
          return { success: false, error: 'Player not found' };
        }
        const team = (fallback as any).player_seasons?.[0]?.team || null;
        return { success: true, data: { ...fallback, schools_teams: team } as unknown as PlayerWithTeam };
      }

      const team = (match as any).player_seasons?.[0]?.team || null;
      return { success: true, data: { ...match, schools_teams: team } as unknown as PlayerWithTeam };
    } catch (err) {
      return this.formatError(err, `Failed to fetch player by IGN and school.`);
    }
  }

  /**
   * Find a player by slugified IGN only (for top-level /players/[slug] route)
   */
  static async getBySlug(playerSlug: string): Promise<ServiceResponse<PlayerWithTeam>> {
    try {
      const supabase = await this.getClient();
      const { ignMatchesSlug } = await import('@/lib/utils/player-slug');

      const { data: allPlayers, error } = await supabase
        .from(TABLE_NAME)
        .select(`
            *,
            player_seasons(
                team:schools_teams(id, name, school_id, schools(id, name, abbreviation, logo_url))
            )
        `);

      if (error) throw error;
      if (!allPlayers || allPlayers.length === 0) {
        return { success: false, error: 'Player not found' };
      }

      const match = allPlayers.find((p: any) => p.ign && ignMatchesSlug(p.ign, playerSlug));

      if (!match) {
        return { success: false, error: 'Player not found' };
      }

      const team = (match as any).player_seasons?.[0]?.team || null;
      return { success: true, data: { ...match, schools_teams: team } as unknown as PlayerWithTeam };
    } catch (err) {
      return this.formatError(err, `Failed to fetch player by slug.`);
    }
  }

  static async insert(player: PlayerInsert): Promise<ServiceResponse<Player>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(player)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: data as Player };
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

      // Fetch photo URL before deleting
      const { data: player, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('photo_url')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from Cloudinary if photo exists
      if (player?.photo_url) {
        try {
          const publicId = extractCloudinaryPublicId(player.photo_url);
          if (publicId) {
            await CloudinaryService.deleteImage(publicId, { resourceType: 'image' });
          }
        } catch (cloudinaryError) {
          console.warn('Failed to delete player photo from Cloudinary:', cloudinaryError);
        }
      }

      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete player.`);
    }
  }

  static async assignTeam(playerId: string, teamId: string, seasonId?: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();

      // If no seasonId provided, try to find the active season? 
      // For now, let's assume seasonId is passed or we default to a "current" one if we had a way to fetch it easily here.
      // Ideally, the caller should provide the seasonId.

      if (!seasonId) {
        // Fallback: fetch the most recent season? Or error?
        // Let's error for now to enforce explicit season handling
        // OR: fetch the active season
        const { data: activeSeason } = await supabase
          .from('seasons')
          .select('id')
          .eq('is_active', true)
          .single();

        if (activeSeason) {
          seasonId = activeSeason.id;
        } else {
          throw new Error('No active season found and no seasonId provided.');
        }
      }

      // Upsert into player_seasons
      // We use upsert to handle re-assignment or new assignment
      const { error } = await supabase
        .from('player_seasons')
        .upsert({
          player_id: playerId,
          team_id: teamId,
          season_id: seasonId
        }, { onConflict: 'player_id, season_id' }); // Ensure one team per season per player

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, 'Failed to assign player to team.');
    }
  }
}

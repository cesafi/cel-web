import { z } from 'zod';
import {
  PaginatedResponse,
  PaginationOptions,
  ServiceResponse,
  FilterValue
} from '@/lib/types/base';
import { BaseService } from './base';
import { Game } from '@/lib/types/games';
import { createGameSchema, updateGameSchema } from '@/lib/validations/games';

const TABLE_NAME = 'games';
const MATCHES_TABLE = 'matches';
const GAME_SCORES_TABLE = 'game_scores';

export class GameService extends BaseService {
  static async getPaginated(
    options: PaginationOptions<Record<string, FilterValue>>,
    selectQuery: string = '*'
  ): Promise<ServiceResponse<PaginatedResponse<Game>>> {
    try {
      const searchableFields = ['game_number', 'match_id', 'created_at'];
      const optionsWithSearchableFields = {
        ...options,
        searchableFields
      };

      const result = await this.getPaginatedData<Game, typeof TABLE_NAME>(
        TABLE_NAME,
        optionsWithSearchableFields,
        selectQuery
      );

      return result;
    } catch (err) {
      return this.formatError(err, `Failed to retrieve paginated games.`);
    }
  }

  static async getAll(): Promise<ServiceResponse<Game[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .order('match_id', { ascending: true })
        .order('game_number', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME} entity.`);
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
      return this.formatError(err, `Failed to get ${TABLE_NAME} count.`);
    }
  }

  static async getRecent(
    limit: number = 5
  ): Promise<ServiceResponse<Pick<Game, 'id' | 'game_number' | 'created_at' | 'match_id'>[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id, game_number, created_at, match_id')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch recent ${TABLE_NAME}.`);
    }
  }

  static async getById(id: number): Promise<ServiceResponse<Game>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.from(TABLE_NAME).select().eq('id', id).single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch ${TABLE_NAME} entity.`);
    }
  }

  static async getByMatchId(matchId: number): Promise<ServiceResponse<Game[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('match_id', matchId)
        .order('game_number', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch games for match ${matchId}.`);
    }
  }

  static async getPaginatedByMatch(
    matchId: number,
    options: PaginationOptions
  ): Promise<ServiceResponse<PaginatedResponse<Game>>> {
    try {
      const supabase = await this.getClient();
      const { page = 1, pageSize = 10, filters } = options;
      const offset = (page - 1) * pageSize;

      let query = supabase.from(TABLE_NAME).select('*', { count: 'exact' }).eq('match_id', matchId);

      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        });
      }

      // Apply pagination and ordering
      const { data, error, count } = await query
        .order('game_number', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) {
        throw error;
      }

      const totalCount = count || 0;
      const pageCount = Math.ceil(totalCount / pageSize);

      return {
        success: true,
        data: {
          data: data || [],
          totalCount,
          pageCount,
          currentPage: page
        }
      };
    } catch (err) {
      return this.formatError(err, `Failed to fetch paginated games for match ${matchId}.`);
    }
  }

  static async insert(data: z.infer<typeof createGameSchema>): Promise<ServiceResponse<Game>> {
    try {
      const supabase = await this.getClient();

      // Validate that the match_id exists
      const { data: matchExists, error: matchError } = await supabase
        .from(MATCHES_TABLE)
        .select('id, best_of')
        .eq('id', data.match_id)
        .single();

      if (matchError && matchError.code !== 'PGRST116') {
        throw matchError;
      }

      if (!matchExists) {
        return {
          success: false,
          error: 'Invalid match ID provided.'
        };
      }

      // Check if game_number already exists for this match
      if (data.game_number) {
        const { data: existingGame, error: existingError } = await supabase
          .from(TABLE_NAME)
          .select('id')
          .eq('match_id', data.match_id)
          .eq('game_number', data.game_number)
          .single();

        if (existingError && existingError.code !== 'PGRST116') {
          throw existingError;
        }

        if (existingGame) {
          return {
            success: false,
            error: `Game number ${data.game_number} already exists for this match.`
          };
        }

        // Validate game_number doesn't exceed match's best_of
        if (data.game_number > matchExists.best_of) {
          return {
            success: false,
            error: `Game number ${data.game_number} exceeds match's best of ${matchExists.best_of}.`
          };
        }
      } else {
        // Auto-assign next game number if not provided
        const { data: existingGames, error: gamesError } = await supabase
          .from(TABLE_NAME)
          .select('game_number')
          .eq('match_id', data.match_id)
          .order('game_number', { ascending: false })
          .limit(1);

        if (gamesError) {
          throw gamesError;
        }

        const nextGameNumber =
          existingGames && existingGames.length > 0 ? existingGames[0].game_number + 1 : 1;

        if (nextGameNumber > matchExists.best_of) {
          return {
            success: false,
            error: `Cannot create more games. Match is best of ${matchExists.best_of}.`
          };
        }

        data.game_number = nextGameNumber;
      }

      // Validate time sequence if times are provided
      if (data.start_at && data.end_at) {
        const startTime = new Date(data.start_at);
        const endTime = new Date(data.end_at);

        if (startTime >= endTime) {
          return {
            success: false,
            error: 'Start time must be before end time.'
          };
        }

        // Calculate and validate duration if provided
        if (data.duration && data.duration !== '00:00:00') {
          const actualDurationMs = endTime.getTime() - startTime.getTime();
          const [hours, minutes, seconds] = data.duration.split(':').map(Number);
          const expectedDurationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

          // Allow 1 second tolerance
          if (Math.abs(actualDurationMs - expectedDurationMs) > 1000) {
            return {
              success: false,
              error: 'Duration does not match the time difference between start and end times.'
            };
          }
        }
      }

      const { data: newGame, error } = await supabase.from(TABLE_NAME).insert(data).select().single();

      if (error) {
        throw error;
      }

      return { success: true, data: newGame };
    } catch (err) {
      return this.formatError(err, `Failed to insert new ${TABLE_NAME} entity.`);
    }
  }

  static async updateById(
    data: z.infer<typeof updateGameSchema>
  ): Promise<ServiceResponse<Game>> {
    try {
      if (!data.id) {
        return { success: false, error: 'Entity ID is required to update.' };
      }

      const supabase = await this.getClient();

      // Get current game data
      const { data: currentGame, error: currentError } = await supabase
        .from(TABLE_NAME)
        .select('match_id, game_number, start_at, end_at, duration')
        .eq('id', data.id)
        .single();

      if (currentError) {
        throw currentError;
      }

      // Validate match_id if provided
      if (data.match_id && data.match_id !== currentGame.match_id) {
        const { data: matchExists, error: matchError } = await supabase
          .from(MATCHES_TABLE)
          .select('id, best_of')
          .eq('id', data.match_id)
          .single();

        if (matchError && matchError.code !== 'PGRST116') {
          throw matchError;
        }

        if (!matchExists) {
          return {
            success: false,
            error: 'Invalid match ID provided.'
          };
        }

        // Check if game_number conflicts in new match
        const gameNumber = data.game_number || currentGame.game_number;
        if (gameNumber > matchExists.best_of) {
          return {
            success: false,
            error: `Game number ${gameNumber} exceeds new match's best of ${matchExists.best_of}.`
          };
        }

        const { data: conflictingGame, error: conflictError } = await supabase
          .from(TABLE_NAME)
          .select('id')
          .eq('match_id', data.match_id)
          .eq('game_number', gameNumber)
          .single();

        if (conflictError && conflictError.code !== 'PGRST116') {
          throw conflictError;
        }

        if (conflictingGame) {
          return {
            success: false,
            error: `Game number ${gameNumber} already exists in the target match.`
          };
        }
      }

      // Validate game_number if provided and staying in same match
      if (data.game_number && (!data.match_id || data.match_id === currentGame.match_id)) {
        const matchId = data.match_id || currentGame.match_id;

        // Get match's best_of
        const { data: matchData, error: matchError } = await supabase
          .from(MATCHES_TABLE)
          .select('best_of')
          .eq('id', matchId)
          .single();

        if (matchError) {
          throw matchError;
        }

        if (data.game_number > matchData.best_of) {
          return {
            success: false,
            error: `Game number ${data.game_number} exceeds match's best of ${matchData.best_of}.`
          };
        }

        // Check for conflicts with other games in same match
        if (data.game_number !== currentGame.game_number) {
          const { data: conflictingGame, error: conflictError } = await supabase
            .from(TABLE_NAME)
            .select('id')
            .eq('match_id', matchId)
            .eq('game_number', data.game_number)
            .neq('id', data.id)
            .single();

          if (conflictError && conflictError.code !== 'PGRST116') {
            throw conflictError;
          }

          if (conflictingGame) {
            return {
              success: false,
              error: `Game number ${data.game_number} already exists for this match.`
            };
          }
        }
      }

      // Validate time sequence
      const startAt = data.start_at !== undefined ? data.start_at : currentGame.start_at;
      const endAt = data.end_at !== undefined ? data.end_at : currentGame.end_at;
      const duration = data.duration !== undefined ? data.duration : currentGame.duration;

      if (startAt && endAt) {
        const startTime = new Date(startAt);
        const endTime = new Date(endAt);

        if (startTime >= endTime) {
          return {
            success: false,
            error: 'Start time must be before end time.'
          };
        }

        // Validate duration consistency if provided
        if (duration && duration !== '00:00:00') {
          const actualDurationMs = endTime.getTime() - startTime.getTime();
          const [hours, minutes, seconds] = duration.split(':').map(Number);
          const expectedDurationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

          // Allow 1 second tolerance
          if (Math.abs(actualDurationMs - expectedDurationMs) > 1000) {
            return {
              success: false,
              error: 'Duration does not match the time difference between start and end times.'
            };
          }
        }
      }

      const { error } = await supabase.from(TABLE_NAME).update(data).eq('id', data.id);

      if (error) {
        throw error;
      }

      // Fetch the updated game
      const { data: updatedGame, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', data.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return { success: true, data: updatedGame };
    } catch (err) {
      return this.formatError(err, `Failed to update ${TABLE_NAME} entity.`);
    }
  }

  static async deleteById(id: number): Promise<ServiceResponse<undefined>> {
    try {
      if (!id) {
        return { success: false, error: 'Entity ID is required to delete.' };
      }

      const supabase = await this.getClient();

      // Check if game has associated scores before deletion
      const { data: scores, error: scoresError } = await supabase
        .from(GAME_SCORES_TABLE)
        .select('id')
        .eq('game_id', id)
        .limit(1);

      if (scoresError) {
        throw scoresError;
      }

      if (scores && scores.length > 0) {
        return {
          success: false,
          error: 'Cannot delete game with associated scores. Delete scores first.'
        };
      }

      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete ${TABLE_NAME} entity.`);
    }
  }

  /**
   * Delete game with cascading deletion of all related game scores
   */
  static async deleteByIdWithCascade(id: number): Promise<ServiceResponse<undefined>> {
    try {
      if (!id) {
        return { success: false, error: 'Entity ID is required to delete.' };
      }

      const supabase = await this.getClient();

      // Delete all game scores for this game first
      const { error: scoresError } = await supabase
        .from(GAME_SCORES_TABLE)
        .delete()
        .eq('game_id', id);

      if (scoresError) {
        throw scoresError;
      }

      // Delete the game
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete ${TABLE_NAME} entity with cascade.`);
    }
  }

  static async calculateMatchDuration(matchId: number): Promise<ServiceResponse<string>> {
    try {
      const supabase = await this.getClient();
      const { data: games, error } = await supabase
        .from(TABLE_NAME)
        .select('duration')
        .eq('match_id', matchId)
        .not('duration', 'is', null);

      if (error) {
        throw error;
      }

      if (!games || games.length === 0) {
        return { success: true, data: '00:00:00' };
      }

      let totalSeconds = 0;
      for (const game of games) {
        const [hours, minutes, seconds] = game.duration.split(':').map(Number);
        totalSeconds += hours * 3600 + minutes * 60 + seconds;
      }

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const remainingSeconds = totalSeconds % 60;

      const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

      return { success: true, data: formattedDuration };
    } catch (err) {
      return this.formatError(err, `Failed to calculate match duration.`);
    }
  }
}

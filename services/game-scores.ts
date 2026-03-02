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

  static async getGameIdById(id: number): Promise<ServiceResponse<number | null>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('game_id')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return { success: true, data: data.game_id };
    } catch (err) {
      return this.formatError(err, `Failed to fetch game_id for score ${id}`);
    }
  }

  static async updateById(data: GameScoreUpdate): Promise<ServiceResponse<undefined>> {
    try {
      if (!data.id) {
        return { success: false, error: 'Entity ID is required to update.' };
      }

      const supabase = await this.getClient();

      // Clean up nulls that might violate generic FK constraints in Supabase types
      const updateData = { ...data, updated_at: nowUtc() };
      if (updateData.game_id === null) {
        delete updateData.game_id;
      }

      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', data.id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update ${TABLE_NAME} entity.`);
    }
  }

  /**
   * Syncs the total match score for all participants based on the individual game scores of a match.
   * For each game, the participant with the higher score is credited with 1 game win.
   * This is called after a game score is created or updated.
   */
  static async syncMatchScoresFromGame(gameId: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();

      // 1. Get the match_id for this game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('match_id')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;
      if (!gameData) return { success: true, data: undefined };

      const matchId = gameData.match_id;

      // 2. Get all games for this match
      const { data: matchGames, error: matchGamesError } = await supabase
        .from('games')
        .select('id')
        .eq('match_id', matchId);

      if (matchGamesError) throw matchGamesError;
      
      const gameIds = matchGames.map(g => g.id);

      // 3. Get all game scores for all games in this match
      const { data: allScores, error: scoresError } = await supabase
        .from(TABLE_NAME)
        .select('game_id, match_participant_id, score')
        .in('game_id', gameIds);

      if (scoresError) throw scoresError;

      // 4. Group scores by game, then count wins per participant
      const scoresByGame: Record<number, { match_participant_id: number; score: number }[]> = {};
      for (const sr of allScores || []) {
        if (!sr.game_id) continue;
        if (!scoresByGame[sr.game_id]) scoresByGame[sr.game_id] = [];
        scoresByGame[sr.game_id].push({ match_participant_id: sr.match_participant_id, score: sr.score });
      }

      // For each game, the participant with the higher score gets +1 match win
      const participantWins: Record<number, number> = {};
      // Initialize all participants to 0
      for (const sr of allScores || []) {
        if (!participantWins[sr.match_participant_id]) {
          participantWins[sr.match_participant_id] = 0;
        }
      }

      for (const gScores of Object.values(scoresByGame)) {
        if (gScores.length >= 2) {
          // Find the participant with the highest score in this game
          const sorted = [...gScores].sort((a, b) => b.score - a.score);
          if (sorted[0].score > sorted[1].score) {
            participantWins[sorted[0].match_participant_id] += 1;
          }
          // If tied, no one gets a win
        }
      }

      // 5. Update the match_participants table
      const updatePromises = Object.entries(participantWins).map(async ([participantId, wins]) => {
        const { error: updateError } = await supabase
          .from('match_participants')
          .update({ match_score: wins })
          .eq('id', parseInt(participantId));
          
        if (updateError) throw updateError;
      });

      await Promise.all(updatePromises);

      // 6. Auto-finish match if a participant has reached required wins
      const { data: matchData, error: matchFetchError } = await supabase
        .from('matches')
        .select('best_of, status')
        .eq('id', matchId)
        .single();

      if (!matchFetchError && matchData && matchData.status !== 'finished') {
        const requiredWins = Math.ceil((matchData.best_of || 1) / 2);
        const hasWinner = Object.values(participantWins).some(wins => wins >= requiredWins);

        if (hasWinner) {
          await supabase
            .from('matches')
            .update({ status: 'finished' })
            .eq('id', matchId);
        }
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to sync match scores from game ${gameId}.`);
    }
  }

  static async deleteByGameId(gameId: number): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('game_id', gameId);

      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete scores for game ${gameId}`);
    }
  }

  static async insertMany(data: GameScoreInsert[]): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const now = nowUtc();
      const withTimestamps = data.map(d => ({
        ...d,
        created_at: now,
        updated_at: now,
      }));

      const { error } = await supabase.from(TABLE_NAME).insert(withTimestamps);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to insert multiple ${TABLE_NAME} entities.`);
    }
  }
}

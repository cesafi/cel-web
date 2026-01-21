import { z } from 'zod';
import { ServiceResponse } from '@/lib/types/base';
import {
  MatchParticipant,
  MatchParticipantWithTeamDetails,
  MatchParticipantWithMatchDetails,
  MatchParticipantWithFullDetails,
  MatchParticipantWithMatchHistory
} from '@/lib/types/match-participants';
import { BaseService } from './base';
import {
  createMatchParticipantSchema,
  updateMatchParticipantSchema
} from '@/lib/validations/match-participants';
import { nowUtc } from '@/lib/utils/utc-time';

const TABLE_NAME = 'match_participants';
const MATCHES_TABLE = 'matches';
const SCHOOLS_TEAMS_TABLE = 'schools_teams';
const GAME_SCORES_TABLE = 'game_scores';

export class MatchParticipantService extends BaseService {
  static async getByMatchId(
    matchId: number
  ): Promise<ServiceResponse<MatchParticipantWithTeamDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          *,
          schools_teams!inner(
            id,
            name,
            schools!inner(name, abbreviation, logo_url)
          )
        `
        )
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch match participants for match ${matchId}.`);
    }
  }

  static async getByTeamId(
    teamId: string
  ): Promise<ServiceResponse<MatchParticipantWithMatchDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          *,
          matches!inner(
            id,
            name,
            scheduled_at
          )
        `
        )
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch match participants for team ${teamId}.`);
    }
  }

  static async getByMatchAndTeam(
    matchId: number,
    teamId: string
  ): Promise<ServiceResponse<MatchParticipantWithTeamDetails>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          *,
          schools_teams!inner(
            id,
            name,
            schools!inner(name, abbreviation, logo_url)
          )
        `
        )
        .eq('match_id', matchId)
        .eq('team_id', teamId)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(
        err,
        `Failed to fetch match participant for match ${matchId} and team ${teamId}.`
      );
    }
  }

  static async insert(
    data: z.infer<typeof createMatchParticipantSchema>
  ): Promise<ServiceResponse<MatchParticipant>> {
    try {
      const supabase = await this.getClient();

      // Check if this team is already participating in this match
      const { data: existingParticipant, error: checkError } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .eq('match_id', data.match_id)
        .eq('team_id', data.team_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        throw checkError;
      }

      if (existingParticipant) {
        return {
          success: false,
          error: `This team is already participating in this match.`
        };
      }

      // Verify that the referenced entities exist
      const [matchCheck, teamCheck] = await Promise.all([
        supabase.from(MATCHES_TABLE).select('id').eq('id', data.match_id).single(),
        supabase.from(SCHOOLS_TEAMS_TABLE).select('id').eq('id', data.team_id).single()
      ]);

      if (matchCheck.error) {
        return { success: false, error: 'Referenced match does not exist.' };
      }
      if (teamCheck.error) {
        return { success: false, error: 'Referenced team does not exist.' };
      }

      const { data: newMatchParticipant, error } = await supabase.from(TABLE_NAME).insert({
        ...data,
        created_at: nowUtc(),
        updated_at: nowUtc()
      }).select().single();

      if (error) {
        throw error;
      }

      return { success: true, data: newMatchParticipant };
    } catch (err) {
      return this.formatError(err, `Failed to insert new match participant.`);
    }
  }

  static async updateById(
    data: z.infer<typeof updateMatchParticipantSchema>
  ): Promise<ServiceResponse<MatchParticipant>> {
    try {
      if (!data.id) {
        return { success: false, error: 'Match participant ID is required to update.' };
      }

      const supabase = await this.getClient();

      // If updating relationship fields, check for duplicates
      if (data.match_id || data.team_id) {
        // Get current participant data to fill in missing relationship IDs
        const { data: currentParticipant, error: currentError } = await supabase
          .from(TABLE_NAME)
          .select('match_id, team_id')
          .eq('id', data.id)
          .single();

        if (currentError) {
          throw currentError;
        }

        const matchId = data.match_id || currentParticipant.match_id;
        const teamId = data.team_id || currentParticipant.team_id;

        // Check if the combination already exists (excluding current participant)
        const { data: existingParticipant, error: checkError } = await supabase
          .from(TABLE_NAME)
          .select('id')
          .eq('match_id', matchId)
          .eq('team_id', teamId)
          .neq('id', data.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 is "not found" error
          throw checkError;
        }

        if (existingParticipant) {
          return {
            success: false,
            error: `This team is already participating in this match.`
          };
        }

        // Verify that the referenced entities exist if they're being updated
        const checks = [];
        if (data.match_id) {
          checks.push(supabase.from(MATCHES_TABLE).select('id').eq('id', data.match_id).single());
        }
        if (data.team_id) {
          checks.push(
            supabase.from(SCHOOLS_TEAMS_TABLE).select('id').eq('id', data.team_id).single()
          );
        }

        if (checks.length > 0) {
          const results = await Promise.all(checks);
          let index = 0;

          if (data.match_id && results[index]?.error) {
            return { success: false, error: 'Referenced match does not exist.' };
          }
          if (data.match_id) index++;

          if (data.team_id && results[index]?.error) {
            return { success: false, error: 'Referenced team does not exist.' };
          }
        }
      }

      const { error } = await supabase.from(TABLE_NAME).update({
        ...data,
        updated_at: nowUtc()
      }).eq('id', data.id);

      if (error) {
        throw error;
      }

      // Fetch the updated match participant
      const { data: updatedMatchParticipant, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', data.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return { success: true, data: updatedMatchParticipant };
    } catch (err) {
      return this.formatError(err, `Failed to update match participant.`);
    }
  }

  static async deleteById(id: number): Promise<ServiceResponse<undefined>> {
    try {
      if (!id) {
        return { success: false, error: 'Match participant ID is required to delete.' };
      }

      const supabase = await this.getClient();

      // Check if this participant has any game scores
      const { data: gameScores, error: checkError } = await supabase
        .from(GAME_SCORES_TABLE)
        .select('id')
        .eq('match_participant_id', id)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (gameScores && gameScores.length > 0) {
        return {
          success: false,
          error:
            'Cannot delete match participant that has game scores. Please remove game scores first.'
        };
      }

      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete match participant.`);
    }
  }

  /**
   * Delete match participant with cascading deletion of all related game scores
   */
  static async deleteByIdWithCascade(id: number): Promise<ServiceResponse<undefined>> {
    try {
      if (!id) {
        return { success: false, error: 'Match participant ID is required to delete.' };
      }

      const supabase = await this.getClient();

      // Delete all game scores for this participant first
      const { error: scoresError } = await supabase
        .from(GAME_SCORES_TABLE)
        .delete()
        .eq('match_participant_id', id);

      if (scoresError) {
        throw scoresError;
      }

      // Delete the match participant
      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete match participant with cascade.`);
    }
  }

  static async getMatchParticipantsWithDetails(
    matchId: number
  ): Promise<ServiceResponse<MatchParticipantWithFullDetails[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          *,
          schools_teams!inner(
            id,
            name,
            schools!inner(name, abbreviation, logo_url)
          ),
          matches!inner(
            id,
            name,
            scheduled_at
          )
        `
        )
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch match participants with details.`);
    }
  }

  static async getTeamMatchHistory(
    teamId: string
  ): Promise<ServiceResponse<MatchParticipantWithMatchHistory[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          *,
          matches!inner(
            id,
            name,
            scheduled_at,
            venue,
            esports_seasons_stages!inner(
              competition_stage,
              esports_categories!inner(
                division,
                levels,
                esports!inner(name)
              )
            )
          )
        `
        )
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch team match history.`);
    }
  }

  static async updateMatchScores(
    scoreUpdates: Array<{ match_id: number; team_id: string; match_score: number | null }>
  ): Promise<ServiceResponse<undefined>> {
    try {
      if (!scoreUpdates || scoreUpdates.length === 0) {
        return { success: false, error: 'No score updates provided.' };
      }

      const supabase = await this.getClient();

      // Update each score individually to handle potential errors gracefully
      const updatePromises = scoreUpdates.map(async (update) => {
        const { error } = await supabase
          .from(TABLE_NAME)
          .update({ match_score: update.match_score })
          .eq('match_id', update.match_id)
          .eq('team_id', update.team_id);

        if (error) {
          throw new Error(`Failed to update score for team ${update.team_id}: ${error.message}`);
        }
      });

      await Promise.all(updatePromises);

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to update match scores.`);
    }
  }
}

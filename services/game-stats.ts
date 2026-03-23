import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { Database } from '@/database.types';
import { MatchParticipantService } from './match-participants';
import { MatchesService } from './matches';
import { GameService } from './games';

// Types
export type StatsMlbbPlayer = Database['public']['Tables']['stats_mlbb_game_player']['Insert'];
export type StatsValorantPlayer = Database['public']['Tables']['stats_valorant_game_player']['Insert'];

export class PostGameStatsService extends BaseService {
  /**
   * Bulk insert MLBB player stats for a game.
   * This should usually clear existing stats for the game first to avoid duplicates if re-uploading.
   */
  static async saveMlbbStats(gameId: number, stats: StatsMlbbPlayer[]): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();

      // Transaction-like approach: Delete existing -> Insert new
      // Note: Actual transactions are not directly supported via client lib in one go without RPC, 
      // but simple sequential ops work for this scale.

      // 1. Delete existing stats for this game
      const { error: deleteError } = await supabase
        .from('stats_mlbb_game_player')
        .delete()
        .eq('game_id', gameId);

      if (deleteError) throw deleteError;

      // 2. Insert new stats
      const { error: insertError } = await supabase
        .from('stats_mlbb_game_player')
        .insert(stats);

      if (insertError) throw insertError;

      // 3. Automate Game & Match Updates
      try {
        await this.processMlbbMatchOutcome(gameId, stats);
      } catch (automationError) {
        console.error('Failed to automate match update for MLBB:', automationError);
        // We don't fail the stat save if automation fails, but log it
      }

      return { success: true, data: undefined };

    } catch (err) {
      return this.formatError(err, 'Failed to save MLBB stats');
    }
  }

  /**
   * Automates match score and status updates based on MLBB stats
   */
  private static async processMlbbMatchOutcome(gameId: number, stats: StatsMlbbPlayer[]) {
    // Determine winner: The team with the 'MVP' player is the winner in MLBB
    const mvpPlayer = stats.find(p => p.is_mvp);
    if (!mvpPlayer || !mvpPlayer.team_id) return; // Cannot determine winner without MVP or team_id

    const winningTeamId = mvpPlayer.team_id;

    // Fetch the game to get matchId
    const gameResult = await GameService.getById(gameId);
    if (!gameResult.success || !gameResult.data?.match_id) return;
    const matchId = gameResult.data.match_id;

    await this.recalculateMatchScores(matchId);
  }

  /**
   * Bulk insert Valorant player stats for a game.
   */
  static async saveValorantStats(gameId: number, stats: StatsValorantPlayer[]): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();

      // 1. Delete existing stats for this game
      const { error: deleteError } = await supabase
        .from('stats_valorant_game_player')
        .delete()
        .eq('game_id', gameId);

      if (deleteError) throw deleteError;

      // 2. Insert new stats
      const { error: insertError } = await supabase
        .from('stats_valorant_game_player')
        .insert(stats);

      if (insertError) throw insertError;

      // 3. Automate Game & Match Updates
      try {
        await this.processValorantMatchOutcome(gameId, stats);
      } catch (automationError) {
        console.error('Failed to automate match update for Valorant:', automationError);
      }

      return { success: true, data: undefined };

    } catch (err) {
      return this.formatError(err, 'Failed to save Valorant stats');
    }
  }

  /**
   * Automates match score and status updates based on Valorant stats
   */
  private static async processValorantMatchOutcome(gameId: number, stats: StatsValorantPlayer[]) {
    if (stats.length === 0) return;

    // For Valorant, we need to know the rounds won to determine the winner.
    // However, stats only provide individual scores. 
    // Usually, the team with more total kills or round wins (from game table?) is used.
    // Since we don't have round scores in the raw stats array right here easily, 
    // a common fallback is checking the team with the MVP, or we can check the team with the most total ACS.
    // For this implementation, we will use the team of the player marked as MVP or highest ACS.
    let winningTeamId = stats[0].team_id;

    const mvpPlayer = stats.find(p => p.is_mvp);
    if (mvpPlayer) {
      winningTeamId = mvpPlayer.team_id;
    } else {
      // Fallback: Team with highest total kills (proxy for round wins if missing)
      const teamTotals = stats.reduce((acc, p) => {
        acc[p.team_id!] = (acc[p.team_id!] || 0) + (p.kills || 0);
        return acc;
      }, {} as Record<string, number>);

      let maxKills = -1;
      for (const [tId, kills] of Object.entries(teamTotals)) {
        if (kills > maxKills) {
          maxKills = kills;
          winningTeamId = tId;
        }
      }
    }

    if (!winningTeamId) return;

    const gameResult = await GameService.getById(gameId);
    if (!gameResult.success || !gameResult.data?.match_id) return;
    const matchId = gameResult.data.match_id;

    await this.recalculateMatchScores(matchId);
  }

  /**
   * Recalculate match scores from all completed games (idempotent).
   * Counts game wins per team by looking at the MVP player in each game's stats.
   * Updates match_participants.match_score, match description, and match status.
   */
  static async recalculateMatchScores(matchId: number) {
    try {
      const supabase = await this.getClient();

      // 1. Fetch match, participants, and all games
      const [matchResult, participantsResult] = await Promise.all([
        MatchesService.getMatchById(matchId),
        MatchParticipantService.getByMatchId(matchId)
      ]);

      if (!matchResult.success || !matchResult.data) return;
      if (!participantsResult.success || !participantsResult.data) return;

      const match = matchResult.data;
      const participants = participantsResult.data;
      if (participants.length < 2) return;

      // Get all games for this match
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, game_number, status')
        .eq('match_id', matchId)
        .order('game_number', { ascending: true });

      if (gamesError || !games) return;

      // 2. For each completed game, find the MVP to determine the winner
      const teamWins: Record<string, number> = {};
      participants.forEach(p => { teamWins[p.team_id] = 0; });

      for (const game of games) {
        if (game.status !== 'completed') continue;

        // Try to determine winner from game_scores first
        const { data: scores } = await supabase
          .from('game_scores')
          .select('match_participant_id, score')
          .eq('game_id', game.id);

        if (scores && scores.length >= 2) {
          const validScores = scores.filter(s => s.score !== null && s.score !== undefined);
          if (validScores.length >= 2) {
            // Sort by score descending to find the highest score
            validScores.sort((a, b) => b.score - a.score);
            const highest = validScores[0];
            const secondHighest = validScores[1];

            // If there's a clear winner (no tie for first)
            if (highest.score > secondHighest.score) {
              const p = participants.find(p => p.id === highest.match_participant_id);
              if (p?.team_id) {
                teamWins[p.team_id] = (teamWins[p.team_id] || 0) + 1;
                continue;
              }
            }
          }
        }

        // Fallback to MLBB stats MVP
        const { data: mlbbMvp } = await supabase
          .from('stats_mlbb_game_player')
          .select('team_id')
          .eq('game_id', game.id)
          .eq('is_mvp', true)
          .maybeSingle();

        if (mlbbMvp?.team_id) {
          teamWins[mlbbMvp.team_id] = (teamWins[mlbbMvp.team_id] || 0) + 1;
          continue;
        }

        // Fallback to Valorant stats MVP or highest round/ACS kills if MVP is missing
        const { data: valoStats } = await supabase
          .from('stats_valorant_game_player')
          .select('team_id, is_mvp, kills')
          .eq('game_id', game.id);

        if (valoStats && valoStats.length > 0) {
          const valoMvp = valoStats.find(s => s.is_mvp);
          if (valoMvp?.team_id) {
            teamWins[valoMvp.team_id] = (teamWins[valoMvp.team_id] || 0) + 1;
            continue;
          }

          // Fallback if no MVP: team with most total kills
          const teamTotals = valoStats.reduce((acc, p) => {
            if (p.team_id) {
              acc[p.team_id] = (acc[p.team_id] || 0) + (p.kills || 0);
            }
            return acc;
          }, {} as Record<string, number>);

          let maxKills = -1;
          let winningTeamId = '';
          for (const [tId, kills] of Object.entries(teamTotals)) {
            if (kills > maxKills) {
              maxKills = kills;
              winningTeamId = tId;
            }
          }

          if (winningTeamId) {
            teamWins[winningTeamId] = (teamWins[winningTeamId] || 0) + 1;
            continue;
          }
        }
      }

      // 3. Update match_participants with recalculated scores
      const scoreUpdates = participants.map(p => ({
        match_id: matchId,
        team_id: p.team_id,
        match_score: teamWins[p.team_id] || 0
      }));

      await MatchParticipantService.updateMatchScores(scoreUpdates);

      // 4. Update description with new scores
      const t1 = participants[0];
      const t2 = participants[1];
      const t1Score = teamWins[t1.team_id] || 0;
      const t2Score = teamWins[t2.team_id] || 0;

      const desc = match.description || '';
      let replaceCount = 0;
      const newDesc = desc.replace(/\(\d+\)/g, (matchStr) => {
        if (replaceCount === 0) {
          replaceCount++;
          return `(${t1Score})`;
        }
        if (replaceCount === 1) {
          replaceCount++;
          return `(${t2Score})`;
        }
        return matchStr; // Return unchanged for 3rd+ matches just in case
      });

      // 5. Check win condition
      const requiredWins = Math.ceil((match.best_of || 1) / 2);
      const maxScore = Math.max(t1Score, t2Score);
      let newStatus = match.status;
      let endAt = match.end_at;

      if (maxScore >= requiredWins) {
        newStatus = 'finished' as any;
        endAt = endAt || new Date().toISOString();
      }

      // 6. Update Match
      await MatchesService.updateMatchById({
        id: matchId,
        description: newDesc,
        ...(newStatus !== match.status ? { status: newStatus as any, end_at: endAt } : {})
      });
    } catch (err) {
      console.error('Failed to recalculate match scores:', err);
    }
  }
}

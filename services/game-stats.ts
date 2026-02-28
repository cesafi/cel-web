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

    await this.updateMatchScoreAndStatus(matchId, winningTeamId);
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

    await this.updateMatchScoreAndStatus(matchId, winningTeamId);
  }

  /**
   * Reusable logic to increment score, check bestOf, and update match description/status
   */
  private static async updateMatchScoreAndStatus(matchId: number, winningTeamId: string) {
    // 1. Fetch match and participants
    const [matchResult, participantsResult] = await Promise.all([
      MatchesService.getMatchById(matchId),
      MatchParticipantService.getByMatchId(matchId)
    ]);

    if (!matchResult.success || !matchResult.data) return;
    if (!participantsResult.success || !participantsResult.data) return;

    const match = matchResult.data;
    const participants = participantsResult.data;

    // 2. Increment score for winning team
    const winningParticipant = participants.find(p => p.team_id === winningTeamId);
    if (!winningParticipant) return;

    const newScore = (winningParticipant.match_score || 0) + 1;
    await MatchParticipantService.updateMatchScores([
      { match_id: matchId, team_id: winningTeamId, match_score: newScore }
    ]);

    // Re-fetch participants to get updated scores for both teams to form the new description
    const updatedPartsRes = await MatchParticipantService.getByMatchId(matchId);
    if (!updatedPartsRes.success || !updatedPartsRes.data) return;
    const uParts = updatedPartsRes.data;

    if (uParts.length < 2) return;

    // Usually participants are sorted T1, T2. Let's rely on their existing order or assume T1 is first.
    const t1 = uParts[0];
    const t2 = uParts[1];

    // Example current description: "USC (0) vs (0) CIT-U - VALO Week 1"
    // We want to regenerate it: "USC (T1_SCORE) vs (T2_SCORE) CIT-U - [Rest of description]"
    // To do this cleanly, we can regex split the existing description or just reconstruct it.
    // Basic reconstruction from their names if teams are populated
    // A safer way is regex replacing the `(N) vs (M)` part.
    const desc = match.description || '';
    const newDesc = desc.replace(
      /\(\d+\)\s*vs\s*\(\d+\)/,
      `(${t1.match_score || 0}) vs (${t2.match_score || 0})`
    );

    // 3. Check win condition
    const requiredWins = Math.ceil((match.best_of || 1) / 2);
    let newStatus = match.status;
    let endAt = match.end_at;

    if (newScore >= requiredWins) {
      newStatus = 'Finished' as any; // Cast to enum type if needed
      endAt = new Date().toISOString();
    }

    // 4. Update Match
    await MatchesService.updateMatchById({
      id: matchId,
      description: newDesc,
      ...(newStatus !== match.status ? { status: newStatus as any, end_at: endAt } : {})
    });
  }
}

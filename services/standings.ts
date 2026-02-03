// Service class for standings operations
import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { 
  StandingsFilters, 
  StandingsResponse, 
  StandingsNavigation, 
  StandingsData,
  GroupStageStandings,
  BracketStandings,
  PlayinsStandings
} from '@/lib/types/standings';

export class StandingsService extends BaseService {
  /**
   * Get available seasons for standings selection
   */
  static async getAvailableSeasons(): Promise<ServiceResponse<Array<{ id: number; name: string; start_at: string; end_at: string }>>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('seasons')
        .select('id, name, start_at, end_at')
        .order('start_at', { ascending: false });

      if (error) throw error;

      // Format season names (use DB name if available, else default to "Season X")
      const seasons = (data || []).map(s => ({
        ...s,
        name: s.name || `Season ${s.id}`
      }));

      return { success: true, data: seasons };
    } catch (err) {
      return this.formatError(err, 'Failed to fetch available seasons');
    }
  }

  /**
   * Get available esports for a season
   */
  static async getAvailableSports(seasonId: number): Promise<ServiceResponse<Array<{ id: number; name: string; logo_url: string | null; abbreviation: string | null }>>> {
    try {
      const supabase = await this.getClient();
      
      // Get esports that have stages in this season
      const { data, error } = await supabase
        .from('esports')
        .select(`
          id,
          name,
          logo_url,
          abbreviation,
          esports_categories!inner (
            esports_seasons_stages!inner (
              season_id
            )
          )
        `)
        .eq('esports_categories.esports_seasons_stages.season_id', seasonId);

      if (error) throw error;

      // Deduplicate and format
      const uniqueIds = new Set();
      const uniquesports = [];
      
      for (const e of (data || [])) {
        if (!uniqueIds.has(e.id)) {
          uniqueIds.add(e.id);
          uniquesports.push({
            id: e.id,
            name: e.name,
            logo_url: e.logo_url,
            abbreviation: e.abbreviation
          });
        }
      }

      return { success: true, data: uniquesports };
    } catch (err) {
      return this.formatError(err, 'Failed to fetch available esports');
    }
  }

  /**
   * Get available categories for an esport in a season
   */
  static async getAvailableCategories(
    seasonId: number, 
    sportId: number
  ): Promise<ServiceResponse<Array<{ id: number; division: string; levels: string; display_name: string }>>> {
    try {
      const supabase = await this.getClient();
      
      const { data, error } = await supabase
        .from('esports_categories')
        .select(`
          id,
          division,
          levels,
          esports_seasons_stages!inner (
            season_id
          )
        `)
        .eq('esport_id', sportId)
        .eq('esports_seasons_stages.season_id', seasonId);

      if (error) throw error;

      const categories = (data || []).map(c => ({
        id: c.id,
        division: c.division,
        levels: c.levels,
        display_name: `${c.division} ${c.levels}`.replace('_', ' ')
      }));

      return { success: true, data: categories };
    } catch (err) {
      return this.formatError(err, 'Failed to fetch available categories');
    }
  }

  /**
   * Get standings navigation data
   */
  static async getStandingsNavigation(filters: StandingsFilters): Promise<ServiceResponse<StandingsNavigation>> {
    try {
      const supabase = await this.getClient();

      // Get season info
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('id, name, start_at, end_at')
        .eq('id', filters.season_id!)
        .single();

      if (seasonError) throw seasonError;

      // Get esport info
      const { data: sport, error: sportError } = await supabase
        .from('esports')
        .select('id, name')
        .eq('id', filters.sport_id!)
        .single();

      if (sportError) throw sportError;

      // Get category info
      const { data: category, error: categoryError } = await supabase
        .from('esports_categories')
        .select('id, division, levels')
        .eq('id', filters.esport_category_id!)
        .single();

      if (categoryError) throw categoryError;

      // Get stages for this category and season
      const { data: stages, error: stagesError } = await supabase
        .from('esports_seasons_stages')
        .select('id, competition_stage, stage_type')
        .eq('season_id', filters.season_id!)
        .eq('esport_category_id', filters.esport_category_id!);

      if (stagesError) throw stagesError;

      const navigation: StandingsNavigation = {
        season: {
          id: season.id,
          name: season.name || `Season ${season.id}`,
          start_at: season.start_at,
          end_at: season.end_at
        },
        sport: {
          id: sport.id,
          name: sport.name
        },
        category: {
          id: category.id,
          division: category.division,
          levels: category.levels,
          display_name: `${category.division} ${category.levels}`.replace('_', ' ')
        },
        stages: (stages || []).map((s: any) => ({
          id: s.id,
          name: s.competition_stage, 
          competition_stage: s.competition_stage,
          stage_type: s.stage_type as 'round_robin' | 'single_elimination' | 'double_elimination',
          order: 0
        }))
      };

      return { success: true, data: navigation };
    } catch (err) {
      return this.formatError(err, 'Failed to fetch standings navigation');
    }
  }

  /**
   * Get group stage standings for a stage - calculated from match results
   */
  static async getGroupStageStandings(stageId: number): Promise<ServiceResponse<GroupStageStandings>> {
    try {
      const supabase = await this.getClient();

      // Get stage info
      const { data: stage, error: stageError } = await supabase
        .from('esports_seasons_stages')
        .select('id, competition_stage')
        .eq('id', stageId)
        .single();

      if (stageError) throw stageError;

      // Get all finished matches for this stage with participants and team details
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          status,
          group_name,
          match_participants (
            team_id,
            match_score,
            schools_teams (
              id,
              name,
              schools (
                name,
                abbreviation,
                logo_url
              )
            )
          )
        `)
        .eq('stage_id', stageId);
        // We fetch ALL matches (upcoming and finished) to populate the teams list and groups
        // .in('status', ['finished', 'completed']);

      if (matchesError) throw matchesError;

      // Calculate standings from match results, grouped by group_name
      // Structure: group_name -> team_id -> stats
      const groupStats: Record<string, Record<string, {
        team_id: string;
        team_name: string;
        school_name: string;
        school_abbreviation: string;
        school_logo_url: string | null;
        matches_played: number;
        wins: number;
        losses: number;
        draws: number;
        games_won: number;
        games_lost: number;
        points: number;
      }>> = {};

      // Process each match
      for (const match of matches || []) {
        const participants = match.match_participants || [];
        if (participants.length < 2) continue;

        const groupName = match.group_name || 'Group Stage';
        
        if (!groupStats[groupName]) {
          groupStats[groupName] = {};
        }

        // Get both participants
        const p1 = participants[0] as any;
        const p2 = participants[1] as any;

        const score1 = p1.match_score ?? 0;
        const score2 = p2.match_score ?? 0;

        // Initialize team stats if not exists in this group
        for (const p of [p1, p2]) {
          const teamId = p.team_id;
          if (!groupStats[groupName][teamId]) {
            groupStats[groupName][teamId] = {
              team_id: teamId,
              team_name: p.schools_teams?.name || 'TBD',
              school_name: p.schools_teams?.schools?.name || 'TBD',
              school_abbreviation: p.schools_teams?.schools?.abbreviation || 'TBD',
              school_logo_url: p.schools_teams?.schools?.logo_url || null,
              matches_played: 0,
              wins: 0,
              losses: 0,
              draws: 0,
              games_won: 0,
              games_lost: 0,
              points: 0
            };
          }
        }

        const stats = groupStats[groupName];

        // Update match counts only if match is finished? 
        // Usually "Matches Played" only counts finished. 
        // But we want to show the team exists.
        
        const isFinished = match.status === 'finished' || match.status === 'completed';

        if (isFinished) {
          stats[p1.team_id].matches_played++;
          stats[p2.team_id].matches_played++;

          // Update game scores
          stats[p1.team_id].games_won += score1;
          stats[p1.team_id].games_lost += score2;
          stats[p2.team_id].games_won += score2;
          stats[p2.team_id].games_lost += score1;

          // Determine winner/loser
          if (score1 > score2) {
            stats[p1.team_id].wins++;
            stats[p1.team_id].points += 3;
            stats[p2.team_id].losses++;
          } else if (score2 > score1) {
            stats[p2.team_id].wins++;
            stats[p2.team_id].points += 3;
            stats[p1.team_id].losses++;
          } else {
            // Draw
            stats[p1.team_id].draws++;
            stats[p1.team_id].points += 1;
            stats[p2.team_id].draws++;
            stats[p2.team_id].points += 1;
          }
        }
      }

      // Format groups array
      const standingGroups = Object.entries(groupStats).map(([groupName, teamsMap]) => {
        const teams = Object.values(teamsMap)
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const aDiff = a.games_won - a.games_lost;
            const bDiff = b.games_won - b.games_lost;
            return bDiff - aDiff;
          })
          .map((team, index) => ({
            ...team,
            goals_for: team.games_won,
            goals_against: team.games_lost,
            goal_difference: team.games_won - team.games_lost,
            position: index + 1
          }));

        return {
          name: groupName,
          teams
        };
      });
      
      // If we have no groups (no matches), return one empty group
      if (standingGroups.length === 0) {
        standingGroups.push({
          name: 'Group Stage',
          teams: []
        });
      }
      
      // Sort groups by name (e.g. Group A, Group B)
      standingGroups.sort((a, b) => a.name.localeCompare(b.name));

      const groupStandings: GroupStageStandings = {
        stage_id: stage.id,
        stage_name: stage.competition_stage,
        competition_stage: 'group_stage',
        groups: standingGroups
      };

      return { success: true, data: groupStandings };
    } catch (err) {
      return this.formatError(err, 'Failed to fetch group stage standings');
    }
  }

  /**
   * Get bracket standings for playoffs
   */
  static async getBracketStandings(stageId: number): Promise<ServiceResponse<BracketStandings>> {
    try {
      const supabase = await this.getClient();

      // Get stage info
      const { data: stage, error: stageError } = await supabase
        .from('esports_seasons_stages')
        .select('id, competition_stage')
        .eq('id', stageId)
        .single();

      if (stageError) throw stageError;

      // Get matches for this stage
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          match_participants (
            *,
            schools_teams (
              id,
              name,
              schools (
                name,
                abbreviation,
                logo_url
              )
            )
          ),
          games (
            id,
            game_number,
            game_scores (
              match_participant_id,
              score
            )
          )
        `)
        .eq('stage_id', stageId)
        .order('round')
        .order('match_order');

      if (matchesError) throw matchesError;

      const bracketStandings: BracketStandings = {
        stage_id: stage.id,
        stage_name: stage.competition_stage, // Use competition_stage as name
        competition_stage: 'playoffs',
        bracket: (matches || []).map((m: any) => {
          const participants = m.match_participants || [];
          const team1 = participants[0];
          const team2 = participants[1];
          // Calculate scores based on games won
          let team1Score = 0;
          let team2Score = 0;

          if (m.games && m.games.length > 0) {
              m.games.forEach((g: any) => {
                  if (g.game_scores && g.game_scores.length >= 2) {
                      const s1 = g.game_scores.find((gs: any) => gs.match_participant_id === team1?.id)?.score || 0;
                      const s2 = g.game_scores.find((gs: any) => gs.match_participant_id === team2?.id)?.score || 0;
                      if (s1 > s2) team1Score++;
                      if (s2 > s1) team2Score++;
                  }
              });
          } else {
             // Fallback to match_score if no games (or manual override)
             team1Score = team1?.match_score || 0;
             team2Score = team2?.match_score || 0;
          }
          
          // Determine winner dynamically if not explicitly set
          // (Though explicit is_winner overrides if we had it, but we calculate it now)
          // Determine winner based on scores if not explicit
          // Since we don't have is_winner, we rely on calculated scores if match is finished
          let winnerTeam = null;
          if (m.status === 'finished') {
              if (team1Score > team2Score) winnerTeam = team1;
              else if (team2Score > team1Score) winnerTeam = team2;
          }
          // Also try to find explicit winner if we had that column, but we don't.

          return {
            match_id: m.id,
            match_name: m.title || `Round ${m.round} Match`,
            round: m.round || 1,
            position: m.match_order || 1,
            group_name: m.group_name,
            match_status: m.status,
            team1: team1 ? {
              team_id: team1.schools_teams?.id || '',
              team_name: team1.schools_teams?.name || 'TBD',
              school_name: team1.schools_teams?.schools?.name || 'TBD',
              school_abbreviation: team1.schools_teams?.schools?.abbreviation || 'TBD',
              school_logo_url: team1.schools_teams?.schools?.logo_url || null,
              score: team1Score
            } : null,
            team2: team2 ? {
              team_id: team2.schools_teams?.id || '',
              team_name: team2.schools_teams?.name || 'TBD',
              school_name: team2.schools_teams?.schools?.name || 'TBD',
              school_abbreviation: team2.schools_teams?.schools?.abbreviation || 'TBD',
              school_logo_url: team2.schools_teams?.schools?.logo_url || null,
              score: team2Score
            } : null,
            winner: winnerTeam ? {
              team_id: winnerTeam.schools_teams?.id || '',
              team_name: winnerTeam.schools_teams?.name || 'TBD',
              school_name: winnerTeam.schools_teams?.schools?.name || 'TBD',
              school_abbreviation: winnerTeam.schools_teams?.schools?.abbreviation || 'TBD',
              school_logo_url: winnerTeam.schools_teams?.schools?.logo_url || null,
              score: winnerTeam === team1 ? team1Score : team2Score
            } : null,
            scheduled_at: m.scheduled_at || new Date().toISOString(),
            venue: m.venue || 'TBD'
          };
        })
      };

      return { success: true, data: bracketStandings };
    } catch (err) {
      return this.formatError(err, 'Failed to fetch bracket standings');
    }
  }

  /**
   * Get full standings response
   */
  static async getStandings(filters: StandingsFilters): Promise<ServiceResponse<StandingsResponse>> {
    try {
      // Get navigation
      const navResult = await this.getStandingsNavigation(filters);
      if (!navResult.success || !navResult.data) {
        return { success: false, error: navResult.error || 'Failed to get navigation' };
      }

      const navigation = navResult.data;

      // Determine which stage to show
      const stageId = filters.stage_id || navigation.stages[0]?.id;
      
      if (!stageId) {
        return { 
          success: true, 
          data: { 
            navigation, 
            standings: { 
              stage_id: 0, 
              stage_name: 'No Stage', 
              competition_stage: 'group_stage', 
              groups: [] 
            } as GroupStageStandings
          }
        };
      }

      // Get the stage type from the passed navigation or re-fetch if needed
      // Actually, navigation.stages should include stage_type now.
      const currentStage = navigation.stages.find(s => s.id === stageId);
      const stageType = currentStage?.stage_type || 'round_robin';

      let standings: StandingsData;

      if (stageType === 'single_elimination' || stageType === 'double_elimination') {
        const result = await this.getBracketStandings(stageId);
        if (!result.success || !result.data) {
          return { success: false, error: result.error || 'Failed to get bracket standings' };
        }
        standings = result.data;
      } else {
        // Default to round_robin
        const result = await this.getGroupStageStandings(stageId);
        if (!result.success || !result.data) {
          return { success: false, error: result.error || 'Failed to get group standings' };
        }
        standings = result.data;
      }

      return { 
        success: true, 
        data: { navigation, standings }
      };
    } catch (err) {
      return this.formatError(err, 'Failed to fetch standings');
    }
  }
}

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
        .select('id, start_at, end_at')
        .order('start_at', { ascending: false });

      if (error) throw error;

      // Format season names from dates
      const seasons = (data || []).map(s => ({
        ...s,
        name: `Season ${s.id}`
      }));

      return { success: true, data: seasons };
    } catch (err) {
      return this.formatError(err, 'Failed to fetch available seasons');
    }
  }

  /**
   * Get available esports for a season
   */
  static async getAvailableSports(seasonId: number): Promise<ServiceResponse<Array<{ id: number; name: string }>>> {
    try {
      const supabase = await this.getClient();
      
      // Get esports that have stages in this season
      const { data, error } = await supabase
        .from('esports')
        .select(`
          id,
          name,
          esports_categories!inner (
            esports_seasons_stages!inner (
              season_id
            )
          )
        `)
        .eq('esports_categories.esports_seasons_stages.season_id', seasonId);

      if (error) throw error;

      // Deduplicate and format
      const uniquesports = (data || []).map(e => ({
        id: e.id,
        name: e.name
      }));

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
        .select('id, start_at, end_at')
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
        .select('id, competition_stage')
        .eq('season_id', filters.season_id!)
        .eq('esport_category_id', filters.esport_category_id!);

      if (stagesError) throw stagesError;

      const navigation: StandingsNavigation = {
        season: {
          id: season.id,
          name: `Season ${season.id}`,
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
        stages: (stages || []).map((s: { id: number; competition_stage: string }) => ({
          id: s.id,
          name: s.competition_stage, // Use competition_stage as name since name column doesn't exist
          competition_stage: s.competition_stage,
          order: 0 // order column doesn't exist
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
        .eq('stage_id', stageId)
        .in('status', ['finished', 'completed']);

      if (matchesError) throw matchesError;

      // Calculate standings from match results
      const teamStats: Record<string, {
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
      }> = {};

      // Process each match
      for (const match of matches || []) {
        const participants = match.match_participants || [];
        if (participants.length < 2) continue;

        // Get both participants
        const p1 = participants[0] as any;
        const p2 = participants[1] as any;

        const score1 = p1.match_score ?? 0;
        const score2 = p2.match_score ?? 0;

        // Initialize team stats if not exists
        for (const p of [p1, p2]) {
          const teamId = p.team_id;
          if (!teamStats[teamId]) {
            teamStats[teamId] = {
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

        // Update match counts
        teamStats[p1.team_id].matches_played++;
        teamStats[p2.team_id].matches_played++;

        // Update game scores
        teamStats[p1.team_id].games_won += score1;
        teamStats[p1.team_id].games_lost += score2;
        teamStats[p2.team_id].games_won += score2;
        teamStats[p2.team_id].games_lost += score1;

        // Determine winner/loser
        if (score1 > score2) {
          teamStats[p1.team_id].wins++;
          teamStats[p1.team_id].points += 3;
          teamStats[p2.team_id].losses++;
        } else if (score2 > score1) {
          teamStats[p2.team_id].wins++;
          teamStats[p2.team_id].points += 3;
          teamStats[p1.team_id].losses++;
        } else {
          // Draw
          teamStats[p1.team_id].draws++;
          teamStats[p1.team_id].points += 1;
          teamStats[p2.team_id].draws++;
          teamStats[p2.team_id].points += 1;
        }
      }

      // Convert to array and sort by points, then game difference
      const standingsArray = Object.values(teamStats)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const aDiff = a.games_won - a.games_lost;
          const bDiff = b.games_won - b.games_lost;
          return bDiff - aDiff;
        })
        .map((team, index) => ({
          team_id: team.team_id,
          team_name: team.team_name,
          school_name: team.school_name,
          school_abbreviation: team.school_abbreviation,
          school_logo_url: team.school_logo_url,
          matches_played: team.matches_played,
          wins: team.wins,
          losses: team.losses,
          draws: team.draws,
          goals_for: team.games_won,
          goals_against: team.games_lost,
          goal_difference: team.games_won - team.games_lost,
          points: team.points,
          position: index + 1
        }));

      const groupStandings: GroupStageStandings = {
        stage_id: stage.id,
        stage_name: stage.competition_stage,
        competition_stage: 'group_stage',
        groups: [{
          teams: standingsArray
        }]
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
          )
        `)
        .eq('esports_season_stage_id', stageId)
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
          const winner = participants.find((p: any) => p.is_winner);

          return {
            match_id: m.id,
            match_name: m.title || `Round ${m.round} Match`,
            round: m.round || 1,
            position: m.match_order || 1,
            team1: team1 ? {
              team_id: team1.schools_teams?.id || '',
              team_name: team1.schools_teams?.name || 'TBD',
              school_name: team1.schools_teams?.schools?.name || 'TBD',
              school_abbreviation: team1.schools_teams?.schools?.abbreviation || 'TBD',
              school_logo_url: team1.schools_teams?.schools?.logo_url || null,
              score: team1.score
            } : null,
            team2: team2 ? {
              team_id: team2.schools_teams?.id || '',
              team_name: team2.schools_teams?.name || 'TBD',
              school_name: team2.schools_teams?.schools?.name || 'TBD',
              school_abbreviation: team2.schools_teams?.schools?.abbreviation || 'TBD',
              school_logo_url: team2.schools_teams?.schools?.logo_url || null,
              score: team2.score
            } : null,
            winner: winner ? {
              team_id: winner.schools_teams?.id || '',
              team_name: winner.schools_teams?.name || 'TBD',
              school_name: winner.schools_teams?.schools?.name || 'TBD',
              school_abbreviation: winner.schools_teams?.schools?.abbreviation || 'TBD',
              school_logo_url: winner.schools_teams?.schools?.logo_url || null,
              score: winner.score
            } : null,
            match_status: m.status || 'upcoming',
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

      // Get the stage type
      const currentStage = navigation.stages.find(s => s.id === stageId);
      const stageType = currentStage?.competition_stage || 'group_stage';

      let standings: StandingsData;

      if (stageType === 'playoffs' || stageType === 'elimination') {
        const result = await this.getBracketStandings(stageId);
        if (!result.success || !result.data) {
          return { success: false, error: result.error || 'Failed to get bracket standings' };
        }
        standings = result.data;
      } else if (stageType === 'playins') {
        // For playins, use bracket format but with different competition_stage
        const result = await this.getBracketStandings(stageId);
        if (!result.success || !result.data) {
          return { success: false, error: result.error || 'Failed to get playins standings' };
        }
        standings = {
          ...result.data,
          competition_stage: 'playins',
          matches: result.data.bracket
        } as unknown as PlayinsStandings;
      } else {
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

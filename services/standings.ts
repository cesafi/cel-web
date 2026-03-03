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
        stages: (stages || [])
          .sort((a, b) => {
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const order: Record<string, number> = { 
              'groupstage': 1, 
              'playins': 2, 
              'playoffs': 3, 
              'finals': 4 
            };
            
            const keyA = normalize(a.competition_stage);
            const keyB = normalize(b.competition_stage);
            
            const orderA = order[keyA] || 99;
            const orderB = order[keyB] || 99;
            return orderA - orderB;
          })
          .map((s: any) => {
            const key = s.competition_stage.toLowerCase().replace(/[^a-z0-9]/g, '');
            let displayName = s.competition_stage;
            
            if (key === 'groupstage') displayName = 'Group Stage';
            else if (key === 'playins') displayName = 'Play-ins';
            else if (key === 'playoffs') displayName = 'Playoffs';
            else if (key === 'finals') displayName = 'Finals';

            return {
              id: s.id,
              name: displayName, 
              competition_stage: s.competition_stage,
              stage_type: s.stage_type as 'round_robin' | 'single_elimination' | 'double_elimination',
              order: 0
            };
          })
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

      // Get stage info with scoring rules and esport type
      const { data: stage, error: stageError } = await supabase
        .from('esports_seasons_stages')
        .select(`
            id, 
            competition_stage, 
            points_win, 
            points_draw, 
            points_loss,
            points_bo3_win_2_0,
            points_bo3_win_2_1,
            points_bo3_loss_1_2,
            points_bo3_loss_0_2,
            points_bo2_win_2_0,
            points_bo2_draw_1_1,
            points_bo2_loss_0_2,
            esports_categories!inner (
                esports!inner (
                    name
                )
            )
        `)
        .eq('id', stageId)
        .single();

      if (stageError) throw stageError;

      // Identify Esport for specific logic
      const esportName = (stage.esports_categories as any)?.esports?.name || '';
      const isValorant = esportName.toLowerCase().includes('valorant');
      const isMLBB = esportName.toLowerCase().includes('mobile legends') || esportName.toLowerCase().includes('mlbb');

      // Default scoring if not set in DB
      const POINTS_WIN = stage.points_win ?? 3;
      const POINTS_DRAW = stage.points_draw ?? 1;
      const POINTS_LOSS = stage.points_loss ?? 0;

      // Get all finished matches for this stage with participants and team details
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          status,
          group_name,
          best_of,
          match_participants (
            id,
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
          ),
          games (
             id,
             duration,
             game_scores (
                match_participant_id,
                score
             )
          )
        `)
        .eq('stage_id', stageId);

      if (matchesError) throw matchesError;

      // Stats Structure
      type TeamStats = {
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
        // Advanced
        rounds_won: number;
        rounds_lost: number;
        total_win_duration_seconds: number;
        win_duration_count: number;
        head_to_head: Record<string, { wins: number, losses: number, draws: number }>; // vs teamId
      };

      // Calculate standings from match results, grouped by group_name
      // Structure: group_name -> team_id -> stats
      const groupStats: Record<string, Record<string, TeamStats>> = {};

      // Helper to init stats
      const initStats = (groupName: string, p: any) => {
           if (!groupStats[groupName]) groupStats[groupName] = {};
           if (!groupStats[groupName][p.team_id]) {
                groupStats[groupName][p.team_id] = {
                  team_id: p.team_id,
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
                  points: 0,
                  rounds_won: 0,
                  rounds_lost: 0,
                  total_win_duration_seconds: 0,
                  win_duration_count: 0,
                  head_to_head: {}
                };
           }
      };

      // Process each match
      for (const match of matches || []) {
        const participants = match.match_participants || [];
        if (participants.length < 2) continue;

        const groupName = match.group_name || 'Group Stage';
        
        // Get both participants
        const p1 = participants[0] as any;
        const p2 = participants[1] as any;

        // Init stats
        initStats(groupName, p1);
        initStats(groupName, p2);

        const stats1 = groupStats[groupName][p1.team_id];
        const stats2 = groupStats[groupName][p2.team_id];

        const score1 = p1.match_score ?? 0;
        const score2 = p2.match_score ?? 0;
        
        const isFinished = match.status === 'finished' || match.status === 'completed';

        if (isFinished) {
          stats1.matches_played++;
          stats2.matches_played++;

          // Update game scores (Game wins/losses)
          stats1.games_won += score1;
          stats1.games_lost += score2;
          stats2.games_won += score2;
          stats2.games_lost += score1;

          // H2H Initialization
          if (!stats1.head_to_head[p2.team_id]) stats1.head_to_head[p2.team_id] = { wins: 0, losses: 0, draws: 0 };
          if (!stats2.head_to_head[p1.team_id]) stats2.head_to_head[p1.team_id] = { wins: 0, losses: 0, draws: 0 };

          // Determine winner/loser
          if (score1 > score2) {
            stats1.wins++;
            stats1.head_to_head[p2.team_id].wins++;
            
            stats2.losses++;
            stats2.head_to_head[p1.team_id].losses++;

            // Advanced BO3 / BO2 Scoring
            if (match.best_of === 3) {
              if (score1 === 2 && score2 === 0) {
                 stats1.points += stage.points_bo3_win_2_0 ?? POINTS_WIN;
                 stats2.points += stage.points_bo3_loss_0_2 ?? POINTS_LOSS;
              } else if (score1 === 2 && score2 === 1) {
                 stats1.points += stage.points_bo3_win_2_1 ?? (POINTS_WIN - 1);
                 stats2.points += stage.points_bo3_loss_1_2 ?? (POINTS_LOSS + 1);
              } else {
                 stats1.points += POINTS_WIN;
                 stats2.points += POINTS_LOSS;
              }
            } else if (match.best_of === 2) {
              if (score1 === 2 && score2 === 0) {
                 stats1.points += stage.points_bo2_win_2_0 ?? POINTS_WIN;
                 stats2.points += stage.points_bo2_loss_0_2 ?? POINTS_LOSS;
              } else {
                 stats1.points += POINTS_WIN;
                 stats2.points += POINTS_LOSS;
              }
            } else {
               stats1.points += POINTS_WIN;
               stats2.points += POINTS_LOSS;
            }
          } else if (score2 > score1) {
            stats2.wins++;
            stats2.head_to_head[p1.team_id].wins++;

            stats1.losses++;
            stats1.head_to_head[p2.team_id].losses++;

            // Advanced BO3 / BO2 Scoring
            if (match.best_of === 3) {
              if (score2 === 2 && score1 === 0) {
                 stats2.points += stage.points_bo3_win_2_0 ?? POINTS_WIN;
                 stats1.points += stage.points_bo3_loss_0_2 ?? POINTS_LOSS;
              } else if (score2 === 2 && score1 === 1) {
                 stats2.points += stage.points_bo3_win_2_1 ?? (POINTS_WIN - 1);
                 stats1.points += stage.points_bo3_loss_1_2 ?? (POINTS_LOSS + 1);
              } else {
                 stats2.points += POINTS_WIN;
                 stats1.points += POINTS_LOSS;
              }
            } else if (match.best_of === 2) {
              if (score2 === 2 && score1 === 0) {
                 stats2.points += stage.points_bo2_win_2_0 ?? POINTS_WIN;
                 stats1.points += stage.points_bo2_loss_0_2 ?? POINTS_LOSS;
              } else {
                 stats2.points += POINTS_WIN;
                 stats1.points += POINTS_LOSS;
              }
            } else {
               stats2.points += POINTS_WIN;
               stats1.points += POINTS_LOSS;
            }
          } else {
            // Draw
            stats1.draws++;
            stats1.head_to_head[p2.team_id].draws++;

            stats2.draws++;
            stats2.head_to_head[p1.team_id].draws++;

            if (match.best_of === 2 && score1 === 1 && score2 === 1) {
               stats1.points += stage.points_bo2_draw_1_1 ?? POINTS_DRAW;
               stats2.points += stage.points_bo2_draw_1_1 ?? POINTS_DRAW;
            } else {
               stats1.points += POINTS_DRAW;
               stats2.points += POINTS_DRAW;
            }
          }

          // --- Advanced Stats Parsing ---
          if (match.games && match.games.length > 0) {
              match.games.forEach((game: any) => {
                  const gs1 = game.game_scores?.find((s: any) => s.match_participant_id === p1.id);
                  const gs2 = game.game_scores?.find((s: any) => s.match_participant_id === p2.id);

                  const s1 = gs1?.score || 0;
                  const s2 = gs2?.score || 0;

                  // 1. Rounds Calculation (Valorant mostly, but useful for others if strict score)
                  if (typeof s1 === 'number' && typeof s2 === 'number') {
                       stats1.rounds_won += s1;
                       stats1.rounds_lost += s2;
                       stats2.rounds_won += s2;
                       stats2.rounds_lost += s1;
                  }

                  // 2. Duration Calculation (MLBB)
                  // Format: "MM:SS" or "HH:MM:SS"
                  if (game.duration) {
                      const parts = game.duration.split(':').map(Number);
                      let seconds = 0;
                      if (parts.length === 3) {
                          // DB format is often "MM:SS:00" (e.g. "12:37:00" = 12m 37s)
                          // Treating part[0] as minutes, part[1] as seconds. 
                          // part[2] is partial seconds/unused.
                          seconds = parts[0] * 60 + parts[1];
                      }
                      else if (parts.length === 2) {
                          seconds = parts[0] * 60 + parts[1];
                      }
                      
                      const p1WonGame = s1 > s2; 
                      const p2WonGame = s2 > s1;

                      if (p1WonGame) {
                          stats1.total_win_duration_seconds += seconds;
                          stats1.win_duration_count++;
                      }
                      if (p2WonGame) {
                          stats2.total_win_duration_seconds += seconds;
                          stats2.win_duration_count++;
                      }
                  }
              });
          }
        }
      }

      const standingGroups = Object.entries(groupStats).map(([groupName, teamsMap]) => {
          let teamsList = Object.values(teamsMap);
          
          // 1. Initial Sort by Points
          teamsList.sort((a, b) => b.points - a.points);
          
          // 2. Resolve Ties (Bucket Sort)
          const resolvedTeams: any[] = [];
          let i = 0;
          while (i < teamsList.length) {
              const currentPoints = teamsList[i].points;
              const tiedGroup = [teamsList[i]];
              let j = i + 1;
              while (j < teamsList.length && teamsList[j].points === currentPoints) {
                  tiedGroup.push(teamsList[j]);
                  j++;
              }

              if (tiedGroup.length > 1) {
                   tiedGroup.sort((a, b) => {
                       // 3a. Mini-League Points (Wins vs Tied Teams)
                       const getMiniPoints = (t: any) => {
                           return tiedGroup.reduce((acc, other) => {
                               if (t.team_id === other.team_id) return acc;
                               const h2h = t.head_to_head[other.team_id];
                               return h2h ? acc + h2h.wins : acc;
                           }, 0);
                       };
                       const miniA = getMiniPoints(a);
                       const miniB = getMiniPoints(b);
                       if (miniA !== miniB) return miniB - miniA;

                       // 3b. Tiebreakers (Time / Diff)
                       if (isMLBB) {
                           const avgA = a.win_duration_count > 0 ? a.total_win_duration_seconds / a.win_duration_count : 999999;
                           const avgB = b.win_duration_count > 0 ? b.total_win_duration_seconds / b.win_duration_count : 999999;
                           if (Math.abs(avgA - avgB) > 0.001) return avgA - avgB;
                       }
                       
                       if (isValorant) {
                           const diffA = a.rounds_won - a.rounds_lost;
                           const diffB = b.rounds_won - b.rounds_lost;
                           if (diffA !== diffB) return diffB - diffA;
                           if (a.rounds_won !== b.rounds_won) return b.rounds_won - a.rounds_won;
                       } else {
                           const diffA = a.games_won - a.games_lost;
                           const diffB = b.games_won - b.games_lost;
                           if (diffA !== diffB) return diffB - diffA;
                           if (a.games_won !== b.games_won) return b.games_won - a.games_won;
                       }
                       return 0;
                   });
              }
              resolvedTeams.push(...tiedGroup);
              i = j;
          }

          // 3. Format Teams
          const finalTeams = resolvedTeams.map((team, index) => {
              let avgDuration = '-';
              if (team.win_duration_count > 0) {
                  const totalSeconds = team.total_win_duration_seconds / team.win_duration_count;
                  const m = Math.floor(totalSeconds / 60);
                  const s = Math.floor(totalSeconds % 60);
                  avgDuration = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
              }
              return {
                  ...team,
                  goals_for: team.games_won,
                  goals_against: team.games_lost,
                  goal_difference: team.games_won - team.games_lost,
                  position: index + 1,
                  round_difference: team.rounds_won - team.rounds_lost,
                  rounds_won: team.rounds_won,
                  rounds_lost: team.rounds_lost,
                  avg_win_duration: avgDuration
              };
          });

          return {
              group_name: groupName,
              teams: finalTeams
          };
      });
      
      // If we have no groups (no matches), return one empty group
      if (standingGroups.length === 0) {
        standingGroups.push({
          group_name: 'Group Stage',
          teams: []
        });
      }
      
      // Sort groups by name (e.g. Group A, Group B)
      standingGroups.sort((a, b) => (a.group_name || '').localeCompare(b.group_name || ''));

      const groupStandings: GroupStageStandings = {
        stage_id: stage.id,
        stage_name: stage.competition_stage,
        competition_stage: 'group_stage',
        esport_type: stage.esports_categories?.esports?.name,
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

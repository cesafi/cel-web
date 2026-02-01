import { BaseService } from './base';
import { MatchWithFullDetails, Match, MatchInsert, MatchUpdate, ScheduleMatch, ScheduleFilters, ScheduleResponse, SchedulePaginationOptions, LeagueOperatorStats } from '@/lib/types/matches';

export class MatchesService extends BaseService {
  /**
   * Common select query for matches with full details
   */
  private static readonly MATCH_SELECT = `
    *,
    esports_seasons_stages (
      id,
      competition_stage,
      season_id,
      esports_categories (
        id,
        division,
        levels,
        esports (
          id,
          name
        )
      ),
      seasons (
        id,
        start_at,
        end_at
      )
    ),
    match_participants (
      *,
      schools_teams (
        id,
        name,
        school:schools (
          id,
          name,
          abbreviation,
          logo_url
        )
      )
    ),
    games (
      *
    )
  `;

  /**
   * Helper to add schedule display fields to matches
   */
  private static enrichMatchWithScheduleFields(match: any): ScheduleMatch {
    const now = new Date();
    const scheduledAt = match.scheduled_at ? new Date(match.scheduled_at) : null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDate = scheduledAt ? new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate()) : null;

    return {
      ...match,
      isToday: matchDate?.getTime() === today.getTime(),
      isPast: scheduledAt ? scheduledAt < now : false,
      displayTime: scheduledAt ? scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD',
      displayDate: scheduledAt ? scheduledAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'
    };
  }

  /**
   * Get a single match by ID with all details
   */
  static async getMatchById(id: number) {
    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase
        .from('matches')
        .select(this.MATCH_SELECT)
        .eq('id', id)
        .single();

      if (error) throw error;

      return { success: true as const, data: data as unknown as MatchWithFullDetails };
    } catch (error) {
      return this.formatError<MatchWithFullDetails>(error, 'Failed to fetch match details');
    }
  }

  /**
   * Get upcoming matches
   */
  static async getUpcomingMatches(limit: number = 4) {
    try {
      const supabase = await this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('matches')
        .select(this.MATCH_SELECT)
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return { success: true as const, data: data as unknown as MatchWithFullDetails[] };
    } catch (error) {
      return this.formatError<MatchWithFullDetails[]>(error, 'Failed to fetch upcoming matches');
    }
  }

  /**
   * Get recent matches (newly created or recently updated/played)
   */
  static async getRecent(limit: number = 5) {
    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase
        .from('matches')
        .select(this.MATCH_SELECT)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true as const, data: data as unknown as MatchWithFullDetails[] };
    } catch (error) {
      return this.formatError<MatchWithFullDetails[]>(error, 'Failed to fetch recent matches');
    }
  }

  /**
   * Update a match by ID
   */
  static async updateMatchById(data: MatchUpdate & { id: number }) {
    try {
      const supabase = await this.getClient();
      const { id, ...updateData } = data;

      const { data: updatedMatch, error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true as const, data: updatedMatch as Match };
    } catch (error) {
      return this.formatError<Match>(error, 'Failed to update match');
    }
  }

  /**
   * Get matches by stage ID with pagination
   */
  static async getMatchesByStageId(stageId: number, options: { page?: number; pageSize?: number } = {}) {
    try {
      const supabase = await this.getClient();
      const { page = 1, pageSize = 10 } = options;
      const offset = (page - 1) * pageSize;

      // First get total count
      const { count, error: countError } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('stage_id', stageId);

      if (countError) throw countError;

      // Then get paginated data
      const { data, error } = await supabase
        .from('matches')
        .select(this.MATCH_SELECT)
        .eq('stage_id', stageId)
        .order('scheduled_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      return { 
        success: true as const, 
        data: {
          matches: data as unknown as MatchWithFullDetails[],
          totalCount: count || 0,
          pageCount: Math.ceil((count || 0) / pageSize)
        }
      };
    } catch (error) {
      return this.formatError<{ matches: MatchWithFullDetails[]; totalCount: number; pageCount: number }>(error, 'Failed to fetch matches by stage');
    }
  }

  /**
   * Create a new match with participants
   */
  static async createMatch(matchData: MatchInsert, participantTeamIds?: string[]) {
    try {
      const supabase = await this.getClient();

      // Insert the match
      const { data: newMatch, error: matchError } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single();

      if (matchError) throw matchError;

      // Insert match participants if provided
      if (participantTeamIds && participantTeamIds.length > 0) {
        const participants = participantTeamIds.map(teamId => ({
          match_id: newMatch.id,
          team_id: teamId,
          match_score: 0
        }));

        const { error: participantError } = await supabase
          .from('match_participants')
          .insert(participants);

        if (participantError) throw participantError;
      }

      return { success: true as const, data: newMatch as Match };
    } catch (error) {
      return this.formatError<Match>(error, 'Failed to create match');
    }
  }

  /**
   * Delete a match by ID
   */
  static async deleteMatchById(id: number) {
    try {
      const supabase = await this.getClient();

      // Delete in order: games first, then participants, then match
      // Note: This assumes CASCADE isn't set up. If it is, we only need to delete the match.
      await supabase.from('games').delete().eq('match_id', id);
      await supabase.from('match_participants').delete().eq('match_id', id);

      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true as const, data: undefined };
    } catch (error) {
      return this.formatError<undefined>(error, 'Failed to delete match');
    }
  }

  /**
   * Get available sport categories with logo and details
   */


  /**
   * Get schedule matches with pagination and filters
   */
  static async getScheduleMatches(options: SchedulePaginationOptions = {}) {
    try {
      const supabase = await this.getClient();
      const { limit = 20, direction = 'future', filters = {}, cursor } = options;
      const now = new Date().toISOString();

      let query = supabase
        .from('matches')
        .select(this.MATCH_SELECT, { count: 'exact' });

      // Apply direction filter
      if (direction === 'future') {
        query = query.gte('scheduled_at', cursor || now);
        query = query.order('scheduled_at', { ascending: true });
      } else {
        query = query.lte('scheduled_at', cursor || now);
        query = query.order('scheduled_at', { ascending: false });
      }
      
      // Temporary fallback: showing all matches ordered by date desc
      // query = query.order('scheduled_at', { ascending: false });

      // Apply filters
      if (filters.season_id) {
        query = query.eq('esports_seasons_stages.season_id', filters.season_id);
      }
      if (filters.stage_id) {
        query = query.eq('stage_id', filters.stage_id);
      }
      if (filters.sport_id) {
        query = query.eq('esports_seasons_stages.esports_categories.esports.id', filters.sport_id);
      }
      if (filters.category_id) {
        query = query.eq('esports_seasons_stages.esports_categories.id', filters.category_id);
      }
      if (filters.division) {
        query = query.eq('esports_seasons_stages.esports_categories.division', filters.division);
      }
      if (filters.status) {
        query = query.eq('status', filters.status as 'upcoming' | 'live' | 'finished' | 'completed' | 'rescheduled' | 'canceled');
      }
      if (filters.date_from) {
        query = query.gte('scheduled_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('scheduled_at', filters.date_to);
      }

      // Apply limit
      query = query.limit(limit + 1); // Fetch one extra to check for more

      const { data, error, count } = await query;

      if (error) throw error;

      const hasMore = (data?.length || 0) > limit;
      const matches = (data?.slice(0, limit) || []).map(m => this.enrichMatchWithScheduleFields(m));

      // Generate cursor for next page
      const lastMatch = matches[matches.length - 1];
      const nextCursor = hasMore && lastMatch?.scheduled_at ? lastMatch.scheduled_at : null;

      const response: ScheduleResponse = {
        matches: matches as ScheduleMatch[],
        nextCursor,
        prevCursor: cursor || null,
        hasMore,
        totalCount: count || 0
      };

      return { success: true as const, data: response };
    } catch (error) {
      return this.formatError<ScheduleResponse>(error, 'Failed to fetch schedule matches');
    }
  }

  /**
   * Get schedule matches with categories for the schedule page (server-side)
   */
  static async getScheduleMatchesWithCategories(options: SchedulePaginationOptions = {}) {
    return this.getScheduleMatches(options);
  }

  /**
   * Get schedule matches centered around the current date
   * Fetches both past and future matches, distributing the limit intelligently
   */
  static async getScheduleMatchesAroundDate(options: {
    totalLimit?: number;
    referenceDate?: string;
    filters?: ScheduleFilters;
  } = {}) {
    try {
      const supabase = await this.getClient();
      const { totalLimit = 20, filters = {} } = options;
      const referenceDate = options.referenceDate || new Date().toISOString();
      
      console.log('[MatchesService] getScheduleMatchesAroundDate called');
      console.log('[MatchesService] Reference date:', referenceDate);
      console.log('[MatchesService] Total limit:', totalLimit);
      console.log('[MatchesService] Filters:', JSON.stringify(filters));
      
      // Calculate initial split - try to get half from each direction
      const halfLimit = Math.ceil(totalLimit / 2);
      
      // Build base query conditions
      const buildQuery = (direction: 'future' | 'past', limit: number) => {
        let query = supabase
          .from('matches')
          .select(this.MATCH_SELECT, { count: 'exact' });

        // Direction filter
        if (direction === 'future') {
          query = query.gte('scheduled_at', referenceDate);
          query = query.order('scheduled_at', { ascending: true });
        } else {
          query = query.lt('scheduled_at', referenceDate);
          query = query.order('scheduled_at', { ascending: false });
        }

        // Apply filters
        if (filters.season_id) {
          query = query.eq('esports_seasons_stages.season_id', filters.season_id);
        }
        if (filters.stage_id) {
          query = query.eq('stage_id', filters.stage_id);
        }
        if (filters.sport_id) {
          query = query.eq('esports_seasons_stages.esports_categories.esports.id', filters.sport_id);
        }
        if (filters.category_id) {
          query = query.eq('esports_seasons_stages.esports_categories.id', filters.category_id);
        }
        if (filters.division) {
          query = query.eq('esports_seasons_stages.esports_categories.division', filters.division);
        }
        if (filters.status) {
          query = query.eq('status', filters.status as 'upcoming' | 'live' | 'finished' | 'completed' | 'rescheduled' | 'canceled');
        }

        // Limit + 1 to check if there are more
        query = query.limit(limit + 1);
        
        return query;
      };

      // Fetch future matches first
      const futureQuery = buildQuery('future', halfLimit);
      const { data: futureData, error: futureError, count: futureCount } = await futureQuery;
      console.log('[MatchesService] Future query result - count:', futureCount, 'data length:', futureData?.length, 'error:', futureError);
      if (futureError) throw futureError;

      const futureMatches = (futureData || []).slice(0, halfLimit);
      const hasMoreFuture = (futureData?.length || 0) > halfLimit;
      
      // Calculate how many past matches we need
      // If we got fewer future matches than half, allocate more to past
      const remainingSlots = totalLimit - futureMatches.length;
      console.log('[MatchesService] Future matches found:', futureMatches.length, 'Remaining slots for past:', remainingSlots);
      
      // Fetch past matches
      const pastQuery = buildQuery('past', remainingSlots);
      const { data: pastData, error: pastError, count: pastCount } = await pastQuery;
      console.log('[MatchesService] Past query result - count:', pastCount, 'data length:', pastData?.length, 'error:', pastError);
      if (pastError) throw pastError;

      const pastMatches = (pastData || []).slice(0, remainingSlots);
      const hasMorePast = (pastData?.length || 0) > remainingSlots;
      console.log('[MatchesService] Past matches found:', pastMatches.length, 'Has more past:', hasMorePast);

      // Combine: past (reversed to chronological) + future
      const pastMatchesChronological = [...pastMatches].reverse();
      const allMatches = [...pastMatchesChronological, ...futureMatches];
      console.log('[MatchesService] Total matches combined:', allMatches.length);
      
      // Enrich all matches
      const enrichedMatches = allMatches.map(m => this.enrichMatchWithScheduleFields(m));

      // Generate cursors
      const oldestMatch = pastMatches[pastMatches.length - 1]; // In desc order, this is the oldest
      const newestFutureMatch = futureMatches[futureMatches.length - 1];
      
      const response = {
        matches: enrichedMatches as ScheduleMatch[],
        pastCursor: hasMorePast && oldestMatch?.scheduled_at ? oldestMatch.scheduled_at : null,
        futureCursor: hasMoreFuture && newestFutureMatch?.scheduled_at ? newestFutureMatch.scheduled_at : null,
        hasMorePast,
        hasMoreFuture,
        totalCount: (futureCount || 0) + (pastCount || 0)
      };

      return { success: true as const, data: response };
    } catch (error) {
      return this.formatError<{
        matches: ScheduleMatch[];
        pastCursor: string | null;
        futureCursor: string | null;
        hasMorePast: boolean;
        hasMoreFuture: boolean;
        totalCount: number;
      }>(error, 'Failed to fetch schedule matches around date');
    }
  }

  /**
   * Get available sport categories for filter dropdowns
   */
  static async getAvailableSportCategories() {
    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase
        .from('esports_categories')
        .select(`
          id,
          division,
          levels,
          esports (
            id,
            name,
            logo_url,
            abbreviation
          )
        `)
        .order('id');

      if (error) throw error;

      // Map to consistent format
      const categories = (data || []).map((cat: any) => ({
        id: cat.id,
        division: cat.division,
        levels: cat.levels,
        esport: cat.esports ? {
            id: cat.esports.id,
            name: cat.esports.name,
            logo_url: cat.esports.logo_url,
            abbreviation: cat.esports.abbreviation
        } : null,
        full_name: cat.esports ? `${cat.esports.name} - ${cat.division}` : `Category ${cat.id}`
      })).filter((c: any) => c.esport !== null);

      return { success: true as const, data: categories };
    } catch (error) {
      return this.formatError<any[]>(error, 'Failed to fetch sport categories');
    }
  }

  /**
   * Get schedule matches grouped by date
   */
  static async getScheduleMatchesByDate(filters: ScheduleFilters = {}) {
    try {
      const supabase = await this.getClient();
      const now = new Date().toISOString();

      let query = supabase
        .from('matches')
        .select(this.MATCH_SELECT);

      // Apply filters
      if (filters.season_id) {
        query = query.eq('esports_seasons_stages.season_id', filters.season_id);
      }
      if (filters.date_from) {
        query = query.gte('scheduled_at', filters.date_from);
      } else {
        query = query.gte('scheduled_at', now);
      }
      if (filters.date_to) {
        query = query.lte('scheduled_at', filters.date_to);
      }

      query = query.order('scheduled_at', { ascending: true }).limit(100);

      const { data, error } = await query;

      if (error) throw error;

      // Group matches by date
      const grouped: Record<string, ScheduleMatch[]> = {};
      for (const match of data || []) {
        const enrichedMatch = this.enrichMatchWithScheduleFields(match);
        const dateKey = enrichedMatch.displayDate || 'Unknown';
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(enrichedMatch as ScheduleMatch);
      }

      return { success: true as const, data: grouped };
    } catch (error) {
      return this.formatError<Record<string, ScheduleMatch[]>>(error, 'Failed to fetch schedule matches by date');
    }
  }
  static async getLeagueOperatorStats(): Promise<import('@/lib/types/base').ServiceResponse<LeagueOperatorStats>> {
    try {
      const supabase = await this.getClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayISO = today.toISOString();
      const tomorrowISO = tomorrow.toISOString();

      // We can run parallel count queries
      const [
        totalRes,
        upcomingRes,
        completedRes,
        cancelledRes,
        todayRes,
        activeStagesRes
      ] = await Promise.all([
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'upcoming'),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'canceled'),
        supabase.from('matches').select('*', { count: 'exact', head: true }).gte('scheduled_at', todayISO).lt('scheduled_at', tomorrowISO),
        // unique stages approach:
        supabase.from('matches').select('stage_id')
      ]);

      const uniqueStages = new Set(activeStagesRes.data?.map(m => m.stage_id).filter(Boolean)).size;

      return {
        success: true,
        data: {
          totalMatches: totalRes.count || 0,
          upcomingMatches: upcomingRes.count || 0,
          completedMatches: completedRes.count || 0,
          pendingActions: cancelledRes.count || 0,
          matchesToday: todayRes.count || 0,
          activeStages: uniqueStages,
          participatingTeams: 0, // Placeholder
          averageAttendance: 450 // Placeholder
        }
      };
    } catch (error) {
      return this.formatError(error, 'Failed to fetch league operator stats');
    }
  }

  static async getTodayMatches(limit: number = 5) {
    try {
      const supabase = await this.getClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('matches')
        .select(this.MATCH_SELECT)
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', tomorrow.toISOString())
        .eq('status', 'upcoming')
        .order('scheduled_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data as unknown as MatchWithFullDetails[] };
    } catch (error) {
      return this.formatError<MatchWithFullDetails[]>(error, 'Failed to fetch matches today');
    }
  }
  static async getMatchByVetoToken(token: string) {
    try {
      const supabase = await this.getClient();

      // We need to find which team this token belongs to
      const { data, error } = await supabase
        .from('matches')
        .select(this.MATCH_SELECT)
        .or(`team1_veto_token.eq.${token},team2_veto_token.eq.${token}`)
        .single();

      if (error) throw error;
      if (!data) return { success: false, error: 'Invalid token' };

      const match = data as unknown as MatchWithFullDetails;
      
      // Determine which team the token belongs to
      let teamId: string | undefined;
      let teamSide: 'team1' | 'team2' | undefined;

      if (match.team1_veto_token === token) {
        teamSide = 'team1';
        // Find team1 ID from participants
        teamId = match.match_participants?.[0]?.team_id; 
      } else if (match.team2_veto_token === token) {
        teamSide = 'team2';
        teamId = match.match_participants?.[1]?.team_id;
      }

      return { 
        success: true as const, 
        data: { 
          match, 
          teamId,
          teamSide
        } 
      };
    } catch (error) {
      return this.formatError(error, 'Failed to fetch match by token');
    }
  }
}


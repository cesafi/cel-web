import { BaseService } from './base';
import { MatchWithFullDetails, Match, MatchUpdate, ScheduleMatch, ScheduleFilters, ScheduleResponse, SchedulePaginationOptions, LeagueOperatorStats } from '@/lib/types/matches';

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
      esports_seasons (
        id,
        name,
        year
      )
    ),
    match_participants (
      *,
      schools_teams (
        id,
        name,
        logo_url,
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

      // Apply filters
      if (filters.season_id) {
        query = query.eq('esports_seasons_stages.season_id', filters.season_id);
      }
      if (filters.sport_id) {
        query = query.eq('esports_seasons_stages.esports_categories.esports.id', filters.sport_id);
      }
      if (filters.category_id) {
        query = query.eq('esports_seasons_stages.esports_categories.id', filters.category_id);
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
            name
          )
        `)
        .order('id');

      if (error) throw error;

      const categories = (data || []).map((cat: any) => ({
        id: cat.id,
        division: cat.division,
        levels: cat.levels,
        sport_name: cat.esports?.name || 'Unknown',
        formatted_name: `${cat.esports?.name || 'Unknown'} - ${cat.division} ${cat.levels}`.replace('_', ' ')
      }));

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
}


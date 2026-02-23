/**
 * Specialized hook for the schedule feature
 * Provides infinite scrolling, date grouping, and filtering capabilities
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSeason } from '@/components/contexts/season-provider';
import { getScheduleMatches, getScheduleMatchesByDate } from '@/actions/matches';
import { ScheduleFilters, SchedulePaginationOptions, ScheduleResponse } from '@/lib/types/matches';

export const scheduleKeys = {
  all: ['schedule'] as const,
  infinite: (options: SchedulePaginationOptions) =>
    [...scheduleKeys.all, 'infinite', options] as const,
  byDate: (filters: ScheduleFilters) => [...scheduleKeys.all, 'byDate', filters] as const
};

/**
 * Hook for infinite scrolling schedule matches
 * Follows LOL Esports pattern: scroll down for future, scroll up for past
 */
export function useInfiniteSchedule(
  options: {
    limit?: number;
    direction?: 'future' | 'past';
    filters?: ScheduleFilters;
  } = {}
) {
  const { currentSeason } = useSeason();
  const { limit = 20, direction = 'future', filters = {} } = options;

  // Merge season filter with provided filters - memoized to prevent unnecessary re-renders
  const mergedFilters: ScheduleFilters = useMemo(() => ({
    ...filters,
    season_id: filters.season_id
  }), [filters]);

  return useInfiniteQuery({
    queryKey: scheduleKeys.infinite({ limit, direction, filters: mergedFilters }),
    queryFn: ({ pageParam, direction: fetchDirection }) =>
      getScheduleMatches({
        cursor: pageParam as string | undefined,
        limit,
        direction: fetchDirection === 'backward' ? 'past' : direction,
        filters: mergedFilters
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.success && lastPage.data) {
        const pageData = lastPage.data as ScheduleResponse;
        if (pageData.direction === 'past') {
          // If the page was fetched going backward, going MORE forward (if we ever do from here)
          // means taking the newest match from that backward slice as our forward cursor.
          return pageData.matches.length > 0
            ? pageData.matches[pageData.matches.length - 1].scheduled_at
            : new Date().toISOString();
        }
        // Normal future scrolling uses the nextCursor directly
        return pageData.hasMore ? pageData.nextCursor : undefined;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.success && firstPage.data) {
        const pageData = firstPage.data as ScheduleResponse;
        if (pageData.direction === 'future') {
          // If the oldest page we have was fetched going forward, we can go backward
          // by using the oldest match in that page as our past cursor.
          return pageData.matches.length > 0
            ? pageData.matches[0].scheduled_at
            : new Date().toISOString();
        }
        if (pageData.direction === 'past') {
          // If we fetched going backward, hasMore tells us if there are even older matches.
          // The nextCursor from a 'past' fetch is actually the cursor to go further into the past.
          return pageData.hasMore ? pageData.nextCursor : undefined;
        }

        // Fallback for older API responses without direction
        return pageData.prevCursor || new Date().toISOString();
      }
      return undefined;
    },
    select: (data) => {
      // Deduplicate matches by id — cursor-based pagination with gte/lte can include
      // boundary matches in both adjacent pages when they share a scheduled_at timestamp
      const allMatches = data.pages.flatMap((page) => (page.success && page.data ? page.data.matches : []));
      const seen = new Set<number>();
      const uniqueMatches = allMatches.filter((match) => {
        if (seen.has(match.id)) return false;
        seen.add(match.id);
        return true;
      });

      return {
        pages: data.pages,
        pageParams: data.pageParams,
        matches: uniqueMatches,
        hasNextPage: data.pages[data.pages.length - 1]?.success
          ? (data.pages[data.pages.length - 1] as { success: true; data: ScheduleResponse }).data?.hasMore ?? false
          : false,
        hasPreviousPage: data.pages[0]?.success ? (data.pages[0] as { success: true; data: ScheduleResponse }).data?.hasMore ?? false : false,
        totalCount: data.pages[0]?.success ? (data.pages[0] as { success: true; data: ScheduleResponse }).data?.totalCount ?? 0 : 0
      };
    }
  });
}

/**
 * Hook for getting schedule matches grouped by date
 * Useful for calendar-style views
 */
export function useScheduleByDate(filters: ScheduleFilters = {}) {
  const { currentSeason } = useSeason();

  // Merge season filter with provided filters - memoized to prevent unnecessary re-renders
  const mergedFilters: ScheduleFilters = useMemo(() => ({
    ...filters,
    season_id: filters.season_id || currentSeason?.id
  }), [filters, currentSeason?.id]);

  return useQuery({
    queryKey: scheduleKeys.byDate(mergedFilters),
    queryFn: () => getScheduleMatchesByDate(mergedFilters),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch schedule matches by date.');
      }

      // The service already returns grouped data
      return data.data;
    },
    enabled: !!currentSeason
  });
}

/**
 * Hook for getting upcoming matches (next N matches)
 */
export function useUpcomingMatches(limit: number = 5, filters: ScheduleFilters = {}) {
  const { currentSeason } = useSeason();

  const mergedFilters: ScheduleFilters = useMemo(() => ({
    ...filters,
    season_id: filters.season_id || currentSeason?.id
  }), [filters, currentSeason?.id]);

  return useQuery({
    queryKey: [...scheduleKeys.all, 'upcoming', limit, mergedFilters],
    queryFn: () =>
      getScheduleMatches({
        limit,
        direction: 'future',
        filters: mergedFilters
      }),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch upcoming matches.');
      }
      return data.data.matches;
    },
    enabled: !!currentSeason
  });
}

/**
 * Hook for getting recent matches (last N matches)
 */
export function useRecentMatches(limit: number = 5, filters: ScheduleFilters = {}) {
  const { currentSeason } = useSeason();

  const mergedFilters: ScheduleFilters = useMemo(() => ({
    ...filters,
    season_id: filters.season_id || currentSeason?.id
  }), [filters, currentSeason?.id]);

  return useQuery({
    queryKey: [...scheduleKeys.all, 'recent', limit, mergedFilters],
    queryFn: () =>
      getScheduleMatches({
        limit,
        direction: 'past',
        filters: mergedFilters
      }),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch recent matches.');
      }
      return data.data.matches;
    },
    enabled: !!currentSeason
  });
}

/**
 * Hook for getting today's matches
 */
export function useTodayMatches(filters: ScheduleFilters = {}) {
  const { currentSeason } = useSeason();
  const today = new Date().toISOString().split('T')[0];

  const mergedFilters: ScheduleFilters = useMemo(() => ({
    ...filters,
    season_id: filters.season_id || currentSeason?.id,
    date_from: today,
    date_to: today
  }), [filters, currentSeason?.id, today]);

  return useQuery({
    queryKey: [...scheduleKeys.all, 'today', mergedFilters],
    queryFn: () =>
      getScheduleMatches({
        limit: 50, // Large limit to get all today's matches
        direction: 'future',
        filters: mergedFilters
      }),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch today's matches.");
      }
      return data.data.matches;
    },
    enabled: !!currentSeason
  });
}

/**
 * Hook for getting this week's matches
 */
export function useThisWeekMatches(filters: ScheduleFilters = {}) {
  const { currentSeason } = useSeason();

  const today = useMemo(() => new Date(), []);
  const endOfWeek = useMemo(() => {
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    return endDate;
  }, [today]);

  const mergedFilters: ScheduleFilters = useMemo(() => ({
    ...filters,
    season_id: filters.season_id || currentSeason?.id,
    date_from: today.toISOString(),
    date_to: endOfWeek.toISOString()
  }), [filters, currentSeason?.id, today, endOfWeek]);

  return useQuery({
    queryKey: [...scheduleKeys.all, 'thisWeek', mergedFilters],
    queryFn: () =>
      getScheduleMatches({
        limit: 100, // Large limit to get all week's matches
        direction: 'future',
        filters: mergedFilters
      }),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch this week's matches.");
      }
      return data.data.matches;
    },
    enabled: !!currentSeason
  });
}

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
    season_id: filters.season_id || currentSeason?.id
  }), [filters, currentSeason?.id]);

  return useInfiniteQuery({
    queryKey: scheduleKeys.infinite({ limit, direction, filters: mergedFilters }),
    queryFn: ({ pageParam }) =>
      getScheduleMatches({
        cursor: pageParam as string | undefined,
        limit,
        direction,
        filters: mergedFilters
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.success && lastPage.data) {
        return lastPage.data.nextCursor;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.success && firstPage.data) {
        return firstPage.data.prevCursor;
      }
      return undefined;
    },
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      matches: data.pages.flatMap((page) => (page.success && page.data ? page.data.matches : [])),
      hasNextPage: data.pages[data.pages.length - 1]?.success
        ? (data.pages[data.pages.length - 1] as { success: true; data: ScheduleResponse }).data?.hasMore ?? false
        : false,
      hasPreviousPage: data.pages[0]?.success ? (data.pages[0] as { success: true; data: ScheduleResponse }).data?.hasMore ?? false : false,
      totalCount: data.pages[0]?.success ? (data.pages[0] as { success: true; data: ScheduleResponse }).data?.totalCount ?? 0 : 0
    }),
    enabled: !!currentSeason
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

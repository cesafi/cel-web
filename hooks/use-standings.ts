'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { StandingsFilters, StandingsResponse } from '@/lib/types/standings';
import {
  getStandings,
  getAvailableSeasons,
  getAvailableSports,
  getAvailableCategories
} from '@/actions/standings';

// Query keys for standings
export const standingsKeys = {
  all: ['standings'] as const,
  filters: (filters: StandingsFilters) => [...standingsKeys.all, filters] as const,
  seasons: ['standings', 'seasons'] as const,
  sports: (seasonId: number) => ['standings', 'sports', seasonId] as const,
  categories: (seasonId: number, sportId: number) => ['standings', 'categories', seasonId, sportId] as const
};

// Parse URL params to StandingsFilters
export function useStandingsFilters(searchParams: ReadonlyURLSearchParams): StandingsFilters {
  return {
    season_id: searchParams.get('season') ? Number(searchParams.get('season')) : undefined,
    sport_id: searchParams.get('sport') ? Number(searchParams.get('sport')) : undefined,
    esport_category_id: searchParams.get('category') ? Number(searchParams.get('category')) : undefined,
    stage_id: searchParams.get('stage') ? Number(searchParams.get('stage')) : undefined
  };
}

// Main standings hook - now uses Supabase via server action
export function useStandings(filters: StandingsFilters) {
  return useQuery({
    queryKey: standingsKeys.filters(filters),
    queryFn: async (): Promise<StandingsResponse> => {
      const result = await getStandings(filters);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch standings');
      }
      return result.data;
    },
    enabled: !!(filters.season_id && filters.sport_id),
    placeholderData: keepPreviousData
  });
}

// Available seasons hook - now uses Supabase
export function useAvailableSeasons() {
  return useQuery({
    queryKey: standingsKeys.seasons,
    queryFn: async () => {
      const result = await getAvailableSeasons();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch seasons');
      }
      return result.data;
    }
  });
}

// Available sports for a season - now uses Supabase
export function useAvailableSports(seasonId: number) {
  return useQuery({
    queryKey: standingsKeys.sports(seasonId),
    queryFn: async () => {
      const result = await getAvailableSports(seasonId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sports');
      }
      return result.data;
    },
    enabled: !!seasonId
  });
}

// Available categories for a sport in a season - now uses Supabase
export function useAvailableCategories(seasonId: number, sportId: number) {
  return useQuery({
    queryKey: standingsKeys.categories(seasonId, sportId),
    queryFn: async () => {
      const result = await getAvailableCategories(seasonId, sportId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch categories');
      }
      return result.data;
    },
    enabled: !!(seasonId && sportId)
  });
}

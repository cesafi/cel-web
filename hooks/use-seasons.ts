import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';

import {
  getPaginatedSeasons,
  getAllSeasons,
  getSeasonById,
  getCurrentSeason,
  getUpcomingSeasons,
  getSeasonsByYear,
  createSeason,
  updateSeasonById,
  deleteSeasonById
} from '@/actions/seasons';

import { SeasonInsert, SeasonUpdate, SeasonPaginationOptions, Season } from '@/lib/types/seasons';

import { PaginatedResponse, ServiceResponse, FilterValue, PaginationOptions } from '@/lib/types/base';
import { useTable } from './use-table';
import { toast } from 'sonner';

export const seasonKeys = {
  all: ['seasons'] as const,
  paginated: (options: SeasonPaginationOptions) =>
    [...seasonKeys.all, 'paginated', options] as const,
  details: (id: number) => [...seasonKeys.all, id] as const,
  current: ['seasons', 'current'] as const,
  upcoming: ['seasons', 'upcoming'] as const,
  byYear: (year: number) => [...seasonKeys.all, 'byYear', year] as const
};

export function usePaginatedSeasons(
  options: SeasonPaginationOptions,
  queryOptions?: UseQueryOptions<
    ServiceResponse<PaginatedResponse<Season>>,
    Error,
    PaginatedResponse<Season>
  >
) {
  return useQuery({
    queryKey: seasonKeys.paginated(options),
    queryFn: () => getPaginatedSeasons(options),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch paginated seasons.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useAllSeasons(
  queryOptions?: UseQueryOptions<ServiceResponse<Season[]>, Error, Season[]>
) {
  return useQuery({
    queryKey: seasonKeys.all,
    queryFn: getAllSeasons,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch all seasons.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useSeasonById(
  id: number,
  queryOptions?: UseQueryOptions<ServiceResponse<Season>, Error, Season>
) {
  return useQuery({
    queryKey: seasonKeys.details(id),
    queryFn: () => getSeasonById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : `Season with ID ${id} not found.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useCreateSeason(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, SeasonInsert>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSeason,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: seasonKeys.all });
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to create season:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useUpdateSeason(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, SeasonUpdate>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSeasonById,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: seasonKeys.all });
        if (variables.id) {
          queryClient.invalidateQueries({ queryKey: seasonKeys.details(variables.id) });
        }
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update season:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useDeleteSeason(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, number>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSeasonById,
    onSuccess: (result, id, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: seasonKeys.all });
        queryClient.invalidateQueries({ queryKey: seasonKeys.details(id) });
        // CRITICAL: Invalidate related entities that depend on this season
        queryClient.invalidateQueries({ queryKey: ['schools-teams'] });
        queryClient.invalidateQueries({ queryKey: ['esports-seasons-stages'] });
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        queryClient.invalidateQueries({ queryKey: ['match_participants'] });
      }
      (mutationOptions?.onSuccess as any)?.(result, id, context);
    },
    onError: (error, id, context) => {
      console.error('Failed to delete season:', error);
      (mutationOptions?.onError as any)?.(error, id, context);
    },
    ...mutationOptions
  });
}

// New utility hooks
export function useCurrentSeason(
  queryOptions?: UseQueryOptions<ServiceResponse<Season | null>, Error, Season | null>
) {
  return useQuery({
    queryKey: seasonKeys.current,
    queryFn: getCurrentSeason,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch current season.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useUpcomingSeasons(
  queryOptions?: UseQueryOptions<ServiceResponse<Season[]>, Error, Season[]>
) {
  return useQuery({
    queryKey: seasonKeys.upcoming,
    queryFn: getUpcomingSeasons,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch upcoming seasons.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useSeasonsByYear(
  year: number,
  queryOptions?: UseQueryOptions<ServiceResponse<Season[]>, Error, Season[]>
) {
  return useQuery({
    queryKey: seasonKeys.byYear(year),
    queryFn: () => getSeasonsByYear(year),
    enabled: !!year,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch seasons by year.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

// Table-specific hook that extends the base season functionality
export function useSeasonsTable() {
  const {
    tableState,
    setPage,
    setPageSize,
    setSortBy,
    setSearch,
    setFilters,
    resetFilters,
    paginationOptions
  } = useTable<Season>({
    initialPage: 1,
    initialPageSize: 10,
    initialSortBy: 'id',
    initialSortOrder: 'asc',
    pageSizeOptions: [5, 10, 25, 50, 100]
  });

  // Fetch paginated seasons
  const {
    data: seasonsData,
    isLoading,
    error,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['seasons', 'paginated', paginationOptions],
    queryFn: () => getPaginatedSeasons(paginationOptions as PaginationOptions<Record<string, FilterValue>>),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch seasons');
      }
      return data.data;
    }
  });

  // Show table body loading when fetching (for sorting, searching, filtering)
  // but not on initial load
  const tableBodyLoading = isFetching && !isLoading;

  const queryClient = useQueryClient();

  // Create season mutation
  const createSeasonMutation = useMutation({
    mutationFn: createSeason,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Season created successfully');
        queryClient.invalidateQueries({ queryKey: ['seasons'] });
      } else {
        toast.error(result.error || 'Failed to create season');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Update season mutation
  const updateSeasonMutation = useMutation({
    mutationFn: (data: SeasonUpdate) => updateSeasonById(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Season updated successfully');
        queryClient.invalidateQueries({ queryKey: ['seasons'] });
      } else {
        toast.error(result.error || 'Failed to update season');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Delete season mutation
  const deleteSeasonMutation = useMutation({
    mutationFn: deleteSeasonById,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Season deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['seasons'] });
      } else {
        toast.error(result.error || 'Failed to delete season');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  return {
    // Data
    seasons: seasonsData?.data || [],
    totalCount: seasonsData?.totalCount || 0,
    pageCount: seasonsData?.pageCount || 0,
    currentPage: tableState.page,
    pageSize: tableState.pageSize,
    loading: isLoading,
    tableBodyLoading,
    error: error?.message || null,

    // Mutations
    createSeason: createSeasonMutation.mutate,
    updateSeason: updateSeasonMutation.mutate,
    deleteSeason: deleteSeasonMutation.mutate,

    // Loading states
    isCreating: createSeasonMutation.isPending,
    isUpdating: updateSeasonMutation.isPending,
    isDeleting: deleteSeasonMutation.isPending,

    // Actions
    refetch,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    onSortChange: setSortBy,
    onSearchChange: setSearch,
    onFiltersChange: setFilters,
    resetFilters
  };
}
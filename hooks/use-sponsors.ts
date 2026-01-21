import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';

import {
  getPaginatedSponsors,
  getAllSponsors,
  getActiveSponsors,
  getSponsorById,
  createSponsor,
  updateSponsorById,
  deleteSponsorById
} from '@/actions/sponsors';

import { SponsorInsert, SponsorUpdate, SponsorPaginationOptions, Sponsor } from '@/lib/types/sponsors';
import { ServiceResponse, FilterValue, PaginationOptions } from '@/lib/types/base';
import { useTable } from './use-table';
import { TableFilters } from '@/lib/types/table';
import { toast } from 'sonner';

// Query key factory
export const sponsorKeys = {
  all: ['sponsors'] as const,
  paginated: (options: SponsorPaginationOptions) =>
    [...sponsorKeys.all, 'paginated', options] as const,
  details: (id: string) => [...sponsorKeys.all, id] as const,
  byStatus: (isActive: boolean) => [...sponsorKeys.all, 'status', isActive] as const
};

// Basic sponsor operations (for non-table use cases)
export function usePaginatedSponsors(
  options: SponsorPaginationOptions,
  queryOptions?: UseQueryOptions<
    { success: boolean; error?: string; data?: { data: Sponsor[]; totalCount: number; pageCount: number; currentPage: number } },
    Error,
    { data: Sponsor[]; totalCount: number; pageCount: number; currentPage: number }
  >
) {
  return useQuery({
    queryKey: sponsorKeys.paginated(options),
    queryFn: () => getPaginatedSponsors(options),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch paginated sponsors.');
      }
      return data.data!;
    },
    ...queryOptions
  });
}

export function useAllSponsors(
  queryOptions?: UseQueryOptions<ServiceResponse<Sponsor[]>, Error, Sponsor[]>
) {
  return useQuery({
    queryKey: sponsorKeys.all,
    queryFn: getAllSponsors,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch all sponsors.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useActiveSponsors(
  queryOptions?: UseQueryOptions<ServiceResponse<Sponsor[]>, Error, Sponsor[]>
) {
  return useQuery({
    queryKey: [...sponsorKeys.all, 'active'],
    queryFn: getActiveSponsors,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch active sponsors.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useSponsorById(
  id: string,
  queryOptions?: UseQueryOptions<ServiceResponse<Sponsor>, Error, Sponsor>
) {
  return useQuery({
    queryKey: sponsorKeys.details(id),
    queryFn: () => getSponsorById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : `Sponsor with ID ${id} not found.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

// Mutation hooks with cache invalidation
export function useCreateSponsor(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, SponsorInsert>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSponsor,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: sponsorKeys.all });
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to create sponsor:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useUpdateSponsor(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, SponsorUpdate>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSponsorById,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: sponsorKeys.all });
        if (variables.id) {
          queryClient.invalidateQueries({ queryKey: sponsorKeys.details(variables.id) });
        }
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update sponsor:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useDeleteSponsor(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSponsorById,
    onSuccess: (result, id, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: sponsorKeys.all });
        queryClient.invalidateQueries({ queryKey: sponsorKeys.details(id) });
      }
      (mutationOptions?.onSuccess as any)?.(result, id, context);
    },
    onError: (error, id, context) => {
      console.error('Failed to delete sponsor:', error);
      (mutationOptions?.onError as any)?.(error, id, context);
    },
    ...mutationOptions
  });
}

// Table-specific hook that extends the base sponsor functionality
export function useSponsorsTable() {
  const {
    tableState,
    setPage,
    setPageSize,
    setSortBy,
    setSearch,
    setFilters,
    resetFilters,
    paginationOptions
  } = useTable<Sponsor>({
    initialPage: 1,
    initialPageSize: 10,
    initialSortBy: 'created_at',
    initialSortOrder: 'desc',
    pageSizeOptions: [5, 10, 25, 50, 100]
  });

  // Fetch paginated data
  const {
    data: sponsorData,
    isLoading,
    error,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['sponsors', 'paginated', paginationOptions],
    queryFn: () => getPaginatedSponsors(paginationOptions as PaginationOptions<Record<string, FilterValue>>),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch sponsors');
      }
      return data.data;
    }
  });

  // Show table body loading when fetching (for sorting, searching, filtering)
  // but not on initial load
  const tableBodyLoading = isFetching && !isLoading;

  const queryClient = useQueryClient();

  // Create sponsor mutation
  const createSponsorMutation = useMutation({
    mutationFn: createSponsor,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Sponsor created successfully');
        queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      } else {
        toast.error(result.error || 'Failed to create sponsor');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Update sponsor mutation
  const updateSponsorMutation = useMutation({
    mutationFn: (data: SponsorUpdate) => updateSponsorById(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Sponsor updated successfully');
        queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      } else {
        toast.error(result.error || 'Failed to update sponsor');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Delete sponsor mutation
  const deleteSponsorMutation = useMutation({
    mutationFn: deleteSponsorById,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Sponsor deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      } else {
        toast.error(result.error || 'Failed to delete sponsor');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Handle search with debouncing
  const handleSearch = (search: string) => {
    setSearch(search);
  };

  // Handle filters
  const handleFilters = (filters: TableFilters) => {
    setFilters(filters);
  };

  // Handle sorting
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSortBy(sortBy, sortOrder);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPageSize(pageSize);
  };

  return {
    // Data
    sponsors: sponsorData?.data || [],
    totalCount: sponsorData?.totalCount || 0,
    pageCount: sponsorData?.pageCount || 0,
    currentPage: tableState.page,
    pageSize: tableState.pageSize,
    loading: isLoading,
    tableBodyLoading,
    error: error?.message || null,

    // Mutations
    createSponsor: createSponsorMutation.mutate,
    updateSponsor: updateSponsorMutation.mutate,
    deleteSponsor: deleteSponsorMutation.mutate,

    // Loading states
    isCreating: createSponsorMutation.isPending,
    isUpdating: updateSponsorMutation.isPending,
    isDeleting: deleteSponsorMutation.isPending,

    // Actions
    refetch,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onSortChange: handleSort,
    onSearchChange: handleSearch,
    onFiltersChange: handleFilters,
    resetFilters
  };
}

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { PaginationOptions, FilterValue } from '@/lib/types/base';
import { useTable } from './use-table';
import { TableFilters, BaseEntity } from '@/lib/types/table';

interface UseEntityTableOptions<T, TInsert, TUpdate> {
  // Query configuration
  queryKey: readonly unknown[];
  fetchAction: (options: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // Mutation configuration
  createAction?: (data: TInsert) => Promise<{ success: boolean; error?: string }>;
  updateAction?: (data: TUpdate) => Promise<{ success: boolean; error?: string }>;
  deleteAction?: (id: any) => Promise<{ success: boolean; error?: string }>;
  
  // Entity metadata
  entityName: string; // e.g., "School", "Sport"
  
  // Table configuration
  defaultSort?: {
    by: string;
    order: 'asc' | 'desc';
  };
  pageSizeOptions?: number[];
  
  // Invalidation keys
  invalidateKeys?: readonly unknown[][]; // Additional keys to invalidate on mutation
}

export function useEntityTable<T extends BaseEntity, TInsert = any, TUpdate = any>({
  queryKey,
  fetchAction,
  createAction,
  updateAction,
  deleteAction,
  entityName,
  defaultSort = { by: 'created_at', order: 'desc' },
  pageSizeOptions = [5, 10, 25, 50, 100],
  invalidateKeys = []
}: UseEntityTableOptions<T, TInsert, TUpdate>) {
  const {
    tableState,
    setPage,
    setPageSize,
    setSortBy,
    setSearch,
    setFilters,
    resetFilters,
    paginationOptions
  } = useTable<T>({
    initialPage: 1,
    initialPageSize: 10,
    initialSortBy: defaultSort.by,
    initialSortOrder: defaultSort.order,
    pageSizeOptions
  });

  // Fetch paginated data
  const {
    data: responseData,
    isLoading,
    error,
    isFetching,
    refetch
  } = useQuery({
    queryKey: [...queryKey, 'paginated', paginationOptions],
    queryFn: () =>
      fetchAction(paginationOptions as PaginationOptions<Record<string, FilterValue>>),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch ${entityName.toLowerCase()}s`);
      }
      return data.data;
    }
  });

  // Show table body loading when fetching (for sorting, searching, filtering)
  // but not on initial load
  const tableBodyLoading = isFetching && !isLoading;

  const queryClient = useQueryClient();

  // Helper for invalidating queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey });
    invalidateKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
    });
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TInsert) => {
      if (!createAction) throw new Error('Create action not defined');
      return createAction(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${entityName} created successfully`);
        invalidateQueries();
      } else {
        toast.error(result.error || `Failed to create ${entityName.toLowerCase()}`);
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: TUpdate) => {
        if (!updateAction) throw new Error('Update action not defined');
        return updateAction(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${entityName} updated successfully`);
        invalidateQueries();
      } else {
        toast.error(result.error || `Failed to update ${entityName.toLowerCase()}`);
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: any) => {
        if (!deleteAction) throw new Error('Delete action not defined');
        return deleteAction(id);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${entityName} deleted successfully`);
        invalidateQueries();
      } else {
        toast.error(result.error || `Failed to delete ${entityName.toLowerCase()}`);
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Handle actions
  const handleSearch = (search: string) => setSearch(search);
  const handleFilters = (filters: TableFilters) => setFilters(filters);
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => setSortBy(sortBy, sortOrder);
  const handlePageChange = (page: number) => setPage(page);
  const handlePageSizeChange = (pageSize: number) => setPageSize(pageSize);

  return {
    // Data
    data: responseData?.data || [], // Renamed from specific name (e.g. schools) to data for generic use
    totalCount: responseData?.totalCount || 0,
    pageCount: responseData?.pageCount || 0,
    currentPage: tableState.page,
    pageSize: tableState.pageSize,
    loading: isLoading,
    tableBodyLoading,
    error: error?.message || null,

    // Mutations
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

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

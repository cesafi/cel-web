'use client';

import {
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';

import {
  getPaginatedAccounts,
  createAccount,
  updateAccount,
  updateAccountRole,
  deleteAccount
} from '@/actions/accounts';

import { AccountEntity } from '@/lib/types/accounts';
import { UpdateAccountFormData } from '@/lib/validations/accounts';
import { useTable } from './use-table';
import { TableFilters } from '@/lib/types/table';
import { PaginationOptions } from '@/lib/types/base';
import { toast } from 'sonner';

export const accountKeys = {
  all: ['accounts'] as const,
  paginated: (options: PaginationOptions) =>
    [...accountKeys.all, 'paginated', options] as const,
  details: (id: string) => [...accountKeys.all, id] as const
};

// Table-specific hook for accounts
export function useAccountsTable() {
  const {
    tableState,
    setPage,
    setPageSize,
    setSortBy,
    setSearch,
    setFilters,
    resetFilters,
    paginationOptions
  } = useTable<AccountEntity>({
    initialPage: 1,
    initialPageSize: 10,
    initialSortBy: 'createdAt',
    initialSortOrder: 'desc',
    pageSizeOptions: [5, 10, 25, 50, 100]
  });

  // Fetch paginated accounts
  const {
    data: accountsData,
    isLoading,
    error,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['accounts', 'paginated', paginationOptions],
    queryFn: () => getPaginatedAccounts(paginationOptions),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch accounts');
      }
      return data.data;
    }
  });

  // Show table body loading when fetching (for sorting, searching, filtering)
  // but not on initial load
  const tableBodyLoading = isFetching && !isLoading;

  const queryClient = useQueryClient();

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Account created successfully');
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
      } else {
        toast.error(result.error || 'Failed to create account');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: ({ userId, accountData }: { userId: string; accountData: UpdateAccountFormData }) =>
      updateAccount(userId, accountData),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Account updated successfully');
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
      } else {
        toast.error(result.error || 'Failed to update account');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Update account role mutation
  const updateAccountRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) =>
      updateAccountRole(userId, newRole),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Account role updated successfully');
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
      } else {
        toast.error(result.error || 'Failed to update account role');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Account deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
      } else {
        toast.error(result.error || 'Failed to delete account');
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
    // Table state
    tableState,

    // Data
    accounts: accountsData?.data || [],
    totalCount: accountsData?.totalCount || 0,
    pageCount: accountsData?.pageCount || 0,
    currentPage: tableState.page,
    pageSize: tableState.pageSize,
    loading: isLoading,
    tableBodyLoading,
    error: error?.message || null,

    // Actions
    createAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    updateAccountRole: updateAccountRoleMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,

    // Mutations state
    isCreating: createAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,

    // Event handlers
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onSortChange: handleSort,
    onSearchChange: handleSearch,
    onFiltersChange: handleFilters,

    // Utilities
    resetFilters,
    paginationOptions,
    refetch
  };
}

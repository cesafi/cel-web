import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';

import {
  getPaginatedPlayers,
  getAllPlayers,
  getAllPlayersWithTeams,
  getPlayersByTeamId,
  getActivePlayers,
  getPlayerById,
  createPlayer,
  updatePlayerById,
  deletePlayerById
} from '@/actions/players';

import { Player, PlayerInsert, PlayerUpdate, PlayerWithTeam, PlayerPaginationOptions } from '@/lib/types/players';
import { PaginatedResponse, ServiceResponse, FilterValue, PaginationOptions } from '@/lib/types/base';
import { useTable } from './use-table';
import { toast } from 'sonner';

export const playerKeys = {
  all: ['players'] as const,
  paginated: (options: PlayerPaginationOptions) =>
    [...playerKeys.all, 'paginated', options] as const,
  details: (id: string) => [...playerKeys.all, id] as const,
  byTeam: (teamId: string) => [...playerKeys.all, 'byTeam', teamId] as const,
  active: ['players', 'active'] as const,
  withTeams: ['players', 'withTeams'] as const
};

export function usePaginatedPlayers(
  options: PlayerPaginationOptions,
  queryOptions?: UseQueryOptions<
    ServiceResponse<PaginatedResponse<PlayerWithTeam>>,
    Error,
    PaginatedResponse<PlayerWithTeam>
  >
) {
  return useQuery({
    queryKey: playerKeys.paginated(options),
    queryFn: () => getPaginatedPlayers(options),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch paginated players.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useAllPlayers(
  queryOptions?: UseQueryOptions<ServiceResponse<Player[]>, Error, Player[]>
) {
  return useQuery({
    queryKey: playerKeys.all,
    queryFn: getAllPlayers,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch all players.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useAllPlayersWithTeams(
  queryOptions?: UseQueryOptions<ServiceResponse<PlayerWithTeam[]>, Error, PlayerWithTeam[]>
) {
  return useQuery({
    queryKey: playerKeys.withTeams,
    queryFn: getAllPlayersWithTeams,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch players with teams.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function usePlayersByTeamId(
  teamId: string,
  queryOptions?: UseQueryOptions<ServiceResponse<Player[]>, Error, Player[]>
) {
  return useQuery({
    queryKey: playerKeys.byTeam(teamId),
    queryFn: () => getPlayersByTeamId(teamId),
    enabled: !!teamId,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch players by team.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useActivePlayers(
  queryOptions?: UseQueryOptions<ServiceResponse<Player[]>, Error, Player[]>
) {
  return useQuery({
    queryKey: playerKeys.active,
    queryFn: getActivePlayers,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch active players.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function usePlayerById(
  id: string,
  queryOptions?: UseQueryOptions<ServiceResponse<PlayerWithTeam>, Error, PlayerWithTeam>
) {
  return useQuery({
    queryKey: playerKeys.details(id),
    queryFn: () => getPlayerById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : `Player with ID ${id} not found.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useCreatePlayer(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, PlayerInsert>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlayer,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: playerKeys.all });
        toast.success('Player created successfully');
      } else {
        toast.error(result.error || 'Failed to create player');
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error('An unexpected error occurred');
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useUpdatePlayer(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, PlayerUpdate>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePlayerById,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: playerKeys.all });
        if (variables.id) {
          queryClient.invalidateQueries({ queryKey: playerKeys.details(variables.id) });
        }
        toast.success('Player updated successfully');
      } else {
        toast.error(result.error || 'Failed to update player');
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error('An unexpected error occurred');
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useDeletePlayer(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlayerById,
    onSuccess: (result, id, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: playerKeys.all });
        queryClient.invalidateQueries({ queryKey: playerKeys.details(id) });
        toast.success('Player deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete player');
      }
      (mutationOptions?.onSuccess as any)?.(result, id, context);
    },
    onError: (error, id, context) => {
      toast.error('An unexpected error occurred');
      (mutationOptions?.onError as any)?.(error, id, context);
    },
    ...mutationOptions
  });
}

export function usePlayersTable() {
  const {
    tableState,
    setPage,
    setPageSize,
    setSortBy,
    setSearch,
    setFilters,
    resetFilters,
    paginationOptions
  } = useTable<PlayerWithTeam>({
    initialPage: 1,
    initialPageSize: 10,
    initialSortBy: 'ign',
    initialSortOrder: 'asc',
    pageSizeOptions: [5, 10, 25, 50, 100]
  });

  const {
    data: playersData,
    isLoading,
    error,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['players', 'paginated', paginationOptions],
    queryFn: () => getPaginatedPlayers(paginationOptions as PaginationOptions<Record<string, FilterValue>>),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch players');
      }
      return data.data;
    }
  });

  const tableBodyLoading = isFetching && !isLoading;
  const queryClient = useQueryClient();

  const createPlayerMutation = useMutation({
    mutationFn: createPlayer,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Player created successfully');
        queryClient.invalidateQueries({ queryKey: ['players'] });
      } else {
        toast.error(result.error || 'Failed to create player');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  const updatePlayerMutation = useMutation({
    mutationFn: (data: PlayerUpdate) => updatePlayerById(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Player updated successfully');
        queryClient.invalidateQueries({ queryKey: ['players'] });
      } else {
        toast.error(result.error || 'Failed to update player');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  const deletePlayerMutation = useMutation({
    mutationFn: deletePlayerById,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Player deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['players'] });
      } else {
        toast.error(result.error || 'Failed to delete player');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  return {
    players: playersData?.data || [],
    totalCount: playersData?.totalCount || 0,
    pageCount: playersData?.pageCount || 0,
    currentPage: tableState.page,
    pageSize: tableState.pageSize,
    loading: isLoading,
    tableBodyLoading,
    error: error?.message || null,
    createPlayer: createPlayerMutation.mutate,
    updatePlayer: updatePlayerMutation.mutate,
    deletePlayer: deletePlayerMutation.mutate,
    isCreating: createPlayerMutation.isPending,
    isUpdating: updatePlayerMutation.isPending,
    isDeleting: deletePlayerMutation.isPending,
    refetch,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    onSortChange: setSortBy,
    onSearchChange: setSearch,
    onFiltersChange: setFilters,
    resetFilters
  };
}

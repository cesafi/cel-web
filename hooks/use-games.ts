import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTable } from './use-table';

import {
  getPaginatedGames,
  getAllGames,
  getGameById,
  getGamesByMatchId,
  getPaginatedGamesByMatch,
  createGame,
  updateGameById,
  deleteGameById,
  deleteGameByIdWithCascade,
  calculateMatchDuration
} from '@/actions/games';

import { GameInsert, GameUpdate, GamePaginationOptions, Game, GameWithDetails } from '@/lib/types/games';

import { PaginatedResponse, ServiceResponse, PaginationOptions } from '@/lib/types/base';

export const gameKeys = {
  all: ['games'] as const,
  paginated: (options: GamePaginationOptions) => [...gameKeys.all, 'paginated', options] as const,
  details: (id: number) => [...gameKeys.all, id] as const,
  byMatch: (matchId: number, options?: PaginationOptions) => [...gameKeys.all, 'match', matchId, options] as const,
  matchDuration: (matchId: number) => [...gameKeys.all, 'duration', matchId] as const
};

export function usePaginatedGames(
  options: GamePaginationOptions,
  queryOptions?: UseQueryOptions<
    ServiceResponse<PaginatedResponse<Game>>,
    Error,
    PaginatedResponse<Game>
  >
) {
  return useQuery({
    queryKey: gameKeys.paginated(options),
    queryFn: () => getPaginatedGames(options),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch paginated games.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useAllGames(
  queryOptions?: UseQueryOptions<ServiceResponse<Game[]>, Error, Game[]>
) {
  return useQuery({
    queryKey: gameKeys.all,
    queryFn: getAllGames,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch all games.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useGameById(
  id: number,
  queryOptions?: UseQueryOptions<ServiceResponse<Game>, Error, Game>
) {
  return useQuery({
    queryKey: gameKeys.details(id),
    queryFn: () => getGameById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || `Game with ID ${id} not found.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useGamesByMatchId(
  matchId: number,
  queryOptions?: UseQueryOptions<ServiceResponse<Game[]>, Error, Game[]>
) {
  return useQuery({
    queryKey: gameKeys.byMatch(matchId),
    queryFn: () => getGamesByMatchId(matchId),
    enabled: !!matchId,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch games for match ${matchId}.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useMatchDuration(
  matchId: number,
  queryOptions?: UseQueryOptions<ServiceResponse<string>, Error, string>
) {
  return useQuery({
    queryKey: gameKeys.matchDuration(matchId),
    queryFn: () => calculateMatchDuration(matchId),
    enabled: !!matchId,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || `Failed to calculate duration for match ${matchId}.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useCreateGame(
  mutationOptions?: UseMutationOptions<ServiceResponse<Game>, Error, GameInsert>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGame,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameKeys.all });
        // Invalidate match-specific queries
        if (variables.match_id) {
          queryClient.invalidateQueries({
            queryKey: gameKeys.byMatch(variables.match_id)
          });
          queryClient.invalidateQueries({
            queryKey: gameKeys.matchDuration(variables.match_id)
          });
          // Invalidate parent match queries
          queryClient.invalidateQueries({ queryKey: ['matches'] });
          queryClient.invalidateQueries({
            queryKey: ['matches', variables.match_id]
          });
        }
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to create game:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useUpdateGame(
  mutationOptions?: UseMutationOptions<ServiceResponse<Game>, Error, GameUpdate>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateGameById,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameKeys.all });
        if (variables.id) {
          queryClient.invalidateQueries({ queryKey: gameKeys.details(variables.id) });
        }
        if (variables.match_id) {
          queryClient.invalidateQueries({
            queryKey: gameKeys.byMatch(variables.match_id)
          });
          queryClient.invalidateQueries({
            queryKey: gameKeys.matchDuration(variables.match_id)
          });
          queryClient.invalidateQueries({ queryKey: ['matches'] });
          queryClient.invalidateQueries({
            queryKey: ['matches', variables.match_id]
          });
        }
        queryClient.invalidateQueries({ queryKey: ['game_scores'] });
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update game:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useDeleteGame(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, number>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGameById,
    onSuccess: (result, id, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameKeys.all });
        queryClient.invalidateQueries({ queryKey: gameKeys.details(id) });
        // Invalidate all match-related queries since we don't know which match this game belonged to
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        // Invalidate related entities
        queryClient.invalidateQueries({ queryKey: ['game_scores'] });
      }
      (mutationOptions?.onSuccess as any)?.(result, id, context);
    },
    onError: (error, id, context) => {
      console.error('Failed to delete game:', error);
      (mutationOptions?.onError as any)?.(error, id, context);
    },
    ...mutationOptions
  });
}

export function useDeleteGameWithCascade(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, number>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGameByIdWithCascade,
    onSuccess: (result, id, context) => {
      if (result.success) {
        toast.success('Game and all related scores deleted successfully');
        queryClient.invalidateQueries({ queryKey: gameKeys.all });
        queryClient.invalidateQueries({ queryKey: gameKeys.details(id) });
        // Invalidate all match-related queries since we don't know which match this game belonged to
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        // Invalidate related entities
        queryClient.invalidateQueries({ queryKey: ['game_scores'] });
      } else {
        toast.error(result.error || 'Failed to delete game');
      }
      (mutationOptions?.onSuccess as any)?.(result, id, context);
    },
    onError: (error, id, context) => {
      toast.error('Failed to delete game');
      console.error('Failed to delete game:', error);
      (mutationOptions?.onError as any)?.(error, id, context);
    },
    ...mutationOptions
  });
}

// Table-specific hook for games management
export function useGamesTable(matchId: number | null, callbacks?: {
  onGameCreated?: () => void;
  onGameUpdated?: () => void;
  onGameDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const {
    tableState,
    setPage,
    setPageSize,
    setSortBy,
    setSearch,
    setFilters,
    resetFilters,
    paginationOptions
  } = useTable<GameWithDetails>({
    initialPage: 1,
    initialPageSize: 10,
  });

  // Fetch games for the match
  const {
    data: paginatedData,
    isLoading: loading,
    error
  } = useQuery({
    queryKey: gameKeys.byMatch(matchId || 0, paginationOptions as PaginationOptions),
    queryFn: async () => {
      if (!matchId) return { data: [], totalCount: 0, pageCount: 0 };
      
      const result = await getPaginatedGamesByMatch(matchId, paginationOptions as PaginationOptions);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch games');
      }
      return result.data;
    },
    enabled: !!matchId,
    staleTime: 30 * 1000, // 30 seconds
  });

  const games = paginatedData?.data || [];
  const totalCount = paginatedData?.totalCount || 0;
  const pageCount = paginatedData?.pageCount || 0;

  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: createGame,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Game created successfully');
        if (matchId) {
          queryClient.invalidateQueries({ queryKey: gameKeys.byMatch(matchId) });
          // Also invalidate the general games queries
          queryClient.invalidateQueries({ queryKey: gameKeys.all });
        }
        callbacks?.onGameCreated?.();
      } else {
        toast.error(result.error || 'Failed to create game');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: updateGameById,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Game updated successfully');
        if (matchId) {
          queryClient.invalidateQueries({ queryKey: gameKeys.byMatch(matchId) });
          // Also invalidate the general games queries
          queryClient.invalidateQueries({ queryKey: gameKeys.all });
        }
        callbacks?.onGameUpdated?.();
      } else {
        toast.error(result.error || 'Failed to update game');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Delete game mutation (with cascade deletion)
  const deleteGameMutation = useMutation({
    mutationFn: deleteGameByIdWithCascade,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Game and all related scores deleted successfully');
        if (matchId) {
          queryClient.invalidateQueries({ queryKey: gameKeys.byMatch(matchId) });
          // Also invalidate the general games queries
          queryClient.invalidateQueries({ queryKey: gameKeys.all });
        }
        callbacks?.onGameDeleted?.();
      } else {
        toast.error(result.error || 'Failed to delete game');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  return {
    // Data
    games,
    totalCount,
    pageCount,
    currentPage: tableState.page,
    pageSize: tableState.pageSize,
    loading,
    tableBodyLoading: loading,
    error: error?.message,

    // Table controls
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    onSortChange: setSortBy,
    onSearchChange: setSearch,
    onFiltersChange: setFilters,
    resetFilters,

    // Mutations
    createGame: createGameMutation.mutate,
    updateGame: updateGameMutation.mutate,
    deleteGame: deleteGameMutation.mutate,

    // Loading states
    isCreating: createGameMutation.isPending,
    isUpdating: updateGameMutation.isPending,
    isDeleting: deleteGameMutation.isPending
  };
}

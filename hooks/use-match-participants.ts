import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';

import {
  getMatchParticipantsByMatchId,
  getMatchParticipantsByTeamId,
  getMatchParticipantByMatchAndTeam,
  createMatchParticipant,
  updateMatchParticipantById,
  deleteMatchParticipantById,
  getMatchParticipantsWithDetails,
  getTeamMatchHistory
} from '@/actions/match-participants';

import {
  MatchParticipantInsert,
  MatchParticipantUpdate,
  MatchParticipant,
  MatchParticipantWithFullDetails,
  MatchParticipantWithMatchHistory
} from '@/lib/types/match-participants';

import { ServiceResponse, PaginationOptions } from '@/lib/types/base';
import { useTable } from './use-table';
import { toast } from 'sonner';


export const matchParticipantKeys = {
  all: ['match-participants'] as const,
  details: (id: number) => [...matchParticipantKeys.all, id] as const,
  byMatch: (matchId: number) => [...matchParticipantKeys.all, 'match', matchId] as const,
  byTeam: (teamId: string) => [...matchParticipantKeys.all, 'team', teamId] as const,
  byMatchAndTeam: (matchId: number, teamId: string) =>
    [...matchParticipantKeys.all, 'match-team', matchId, teamId] as const,
  withDetails: (matchId: number) => [...matchParticipantKeys.all, 'details', matchId] as const,
  teamHistory: (teamId: string) => [...matchParticipantKeys.all, 'history', teamId] as const,
  // Table-specific keys
  table: (matchId: number, options?: PaginationOptions) => [...matchParticipantKeys.all, 'table', matchId, options] as const,
  // Detail keys (for backward compatibility)
  detailKeys: {
    participants: (matchId: number) => ['match-participant-details', matchId] as const,
  }
};

// ============================================================================
// BASIC QUERY HOOKS
// ============================================================================

export function useMatchParticipantsByMatchId(
  matchId: number,
  queryOptions?: UseQueryOptions<ServiceResponse<MatchParticipant[]>, Error, MatchParticipant[]>
) {
  return useQuery({
    queryKey: matchParticipantKeys.byMatch(matchId),
    queryFn: () => getMatchParticipantsByMatchId(matchId),
    enabled: !!matchId,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch match participants for match ${matchId}.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useMatchParticipantsByTeamId(
  teamId: string,
  queryOptions?: UseQueryOptions<ServiceResponse<MatchParticipant[]>, Error, MatchParticipant[]>
) {
  return useQuery({
    queryKey: matchParticipantKeys.byTeam(teamId),
    queryFn: () => getMatchParticipantsByTeamId(teamId),
    enabled: !!teamId,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch match participants for team ${teamId}.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useMatchParticipantByMatchAndTeam(
  matchId: number,
  teamId: string,
  queryOptions?: UseQueryOptions<ServiceResponse<MatchParticipant>, Error, MatchParticipant>
) {
  return useQuery({
    queryKey: matchParticipantKeys.byMatchAndTeam(matchId, teamId),
    queryFn: () => getMatchParticipantByMatchAndTeam(matchId, teamId),
    enabled: !!matchId && !!teamId,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch match participant for match ${matchId}, team ${teamId}.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useMatchParticipantsWithDetails(
  matchId: number,
  queryOptions?: UseQueryOptions<ServiceResponse<MatchParticipantWithFullDetails[]>, Error, MatchParticipantWithFullDetails[]>
) {
  return useQuery({
    queryKey: matchParticipantKeys.withDetails(matchId),
    queryFn: () => getMatchParticipantsWithDetails(matchId),
    enabled: !!matchId,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch match participants with details for match ${matchId}.`);
      }
      return data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...queryOptions
  });
}

export function useTeamMatchHistory(
  teamId: string,
  queryOptions?: UseQueryOptions<ServiceResponse<MatchParticipantWithMatchHistory[]>, Error, MatchParticipantWithMatchHistory[]>
) {
  return useQuery({
    queryKey: matchParticipantKeys.teamHistory(teamId),
    queryFn: () => getTeamMatchHistory(teamId),
    enabled: !!teamId,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch match history for team ${teamId}.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

// ============================================================================
// DETAILS HOOKS (for backward compatibility)
// ============================================================================

export function useMatchParticipantsDetails(matchId: number) {
  return useQuery({
    queryKey: matchParticipantKeys.detailKeys.participants(matchId),
    queryFn: async (): Promise<MatchParticipantWithFullDetails[]> => {
      const result: ServiceResponse<MatchParticipantWithFullDetails[]> = await getMatchParticipantsWithDetails(matchId);
      if (!result.success) {
        throw new Error(result.error || `Failed to fetch match participants for match ${matchId}.`);
      }
      return result.data || [];
    },
    enabled: !!matchId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateMatchParticipant(
  mutationOptions?: UseMutationOptions<ServiceResponse<MatchParticipant>, Error, MatchParticipantInsert>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMatchParticipant,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        // Invalidate match participants queries
        queryClient.invalidateQueries({
          queryKey: matchParticipantKeys.byMatch(variables.match_id)
        });
        queryClient.invalidateQueries({
          queryKey: matchParticipantKeys.withDetails(variables.match_id)
        });
        // Also invalidate match details to update participant count
        queryClient.invalidateQueries({
          queryKey: ['match-details', variables.match_id]
        });
        // Invalidate team history
        queryClient.invalidateQueries({
          queryKey: matchParticipantKeys.byTeam(variables.team_id)
        });
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to create match participant:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useUpdateMatchParticipant(
  mutationOptions?: UseMutationOptions<ServiceResponse<MatchParticipant>, Error, MatchParticipantUpdate>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateMatchParticipantById,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: matchParticipantKeys.details(variables.id) });
        queryClient.invalidateQueries({ queryKey: matchParticipantKeys.all });
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update match participant:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useDeleteMatchParticipant(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, number>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMatchParticipantById,
    onSuccess: (result, id, context) => {
      if (result.success) {
        // Invalidate all match participant queries
        queryClient.invalidateQueries({ queryKey: matchParticipantKeys.all });
        // Also invalidate match details to update participant count
        queryClient.invalidateQueries({ queryKey: ['match-details'] });
      }
      (mutationOptions?.onSuccess as any)?.(result, id, context);
    },
    onError: (error, id, context) => {
      console.error('Failed to delete match participant:', error);
      (mutationOptions?.onError as any)?.(error, id, context);
    },
    ...mutationOptions
  });
}

export function useUpdateMatchScores(
  mutationOptions?: UseMutationOptions<
    ServiceResponse<undefined>, 
    Error, 
    Array<{ match_id: number; team_id: string; match_score: number | null }>
  >
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scoreUpdates) => {
      // Import the service function
      const { MatchParticipantService } = await import('@/services/match-participants');
      return MatchParticipantService.updateMatchScores(scoreUpdates);
    },
    onSuccess: (result, variables, context) => {
      if (result.success) {
        // Invalidate match participants queries for the affected match
        const matchId = variables[0]?.match_id;
        if (matchId) {
          queryClient.invalidateQueries({
            queryKey: matchParticipantKeys.byMatch(matchId)
          });
          queryClient.invalidateQueries({
            queryKey: matchParticipantKeys.withDetails(matchId)
          });
          // Also invalidate match details to update any score-related displays
          queryClient.invalidateQueries({
            queryKey: ['match-details', matchId]
          });
        }
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update match scores:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

// ============================================================================
// TABLE HOOKS
// ============================================================================

export function useMatchParticipantsTable(matchId: number) {
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
  } = useTable<MatchParticipantWithFullDetails>({
    initialPage: 1,
    initialPageSize: 10,
  });

  // Fetch participants for the match
  const {
    data: participants = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: matchParticipantKeys.table(matchId, paginationOptions as PaginationOptions),
    queryFn: async () => {
      const result = await getMatchParticipantsWithDetails(matchId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch match participants');
      }
      return result.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // For now, we'll use simple pagination on the client side
  // In the future, this could be moved to server-side pagination
  const startIndex = (tableState.page - 1) * tableState.pageSize;
  const endIndex = startIndex + tableState.pageSize;
  const paginatedParticipants = participants.slice(startIndex, endIndex);
  const totalCount = participants.length;
  const pageCount = Math.ceil(totalCount / tableState.pageSize);

  // Add participant mutation (placeholder for future implementation)
  const addParticipantMutation = useMutation({
    mutationFn: async (_teamId: string) => {
      // This would be implemented when we add the team selection functionality
      throw new Error('Add participant not implemented yet');
    },
    onSuccess: () => {
      toast.success('Team added to match successfully');
      queryClient.invalidateQueries({ queryKey: matchParticipantKeys.table(matchId) });
    },
    onError: () => {
      toast.error('Failed to add team to match');
    }
  });

  // Remove participant mutation
  const removeParticipantMutation = useMutation({
    mutationFn: deleteMatchParticipantById,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Team removed from match successfully');
        queryClient.invalidateQueries({ queryKey: matchParticipantKeys.table(matchId) });
      } else {
        toast.error(result.error || 'Failed to remove team from match');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  return {
    // Data
    participants: paginatedParticipants,
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
    addParticipant: addParticipantMutation.mutate,
    removeParticipant: removeParticipantMutation.mutate,

    // Loading states
    isAdding: addParticipantMutation.isPending,
    isRemoving: removeParticipantMutation.isPending,

    // Actions
    refetch
  };
}



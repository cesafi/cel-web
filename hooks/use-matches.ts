import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getMatchById, 
  getMatchesByStageId, 
  createMatch as createMatchAction, 
  updateMatchById as updateMatchByIdAction,
  deleteMatchById as deleteMatchByIdAction 
} from '@/actions/matches';
import { MatchWithFullDetails, MatchInsert, MatchUpdate } from '@/lib/types/matches';
import { toast } from 'sonner';

export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters: string) => [...matchKeys.lists(), { filters }] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: number) => [...matchKeys.details(), id] as const,
};

export function useMatchByIdWithFullDetails(id: number) {
  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: async () => {
      const result = await getMatchById(id);
      if (!result.success) throw new Error(result.error);
      return result.data as MatchWithFullDetails;
    },
    enabled: !isNaN(id),
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MatchUpdate }) => {
      // Stub implementation - actual action needed
      // const result = await updateMatch(id, data);
      // if (!result.success) throw new Error(result.error);
      return { success: true }; 
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
      toast.success('Match updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update match: ${error.message}`);
    },
  });
}

export function usePaginatedMatches(options: any) {
    // Stub - returns structure expected by pages with proper typing
    type MatchStub = {
        id: number;
        name: string;
        status: string;
        scheduled_at: string | null;
        venue: string | null;
        stage_id: number | null;
    };
    
    return {
        data: {
            data: [] as MatchStub[],
            total: 0
        },
        isLoading: false,
        total: 0,
        pageCount: 0
    };
}

export function useMatchesTable(stageId: number | null) {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    // Fetch matches by stage ID
    const { 
      data: matchesData,
      isLoading,
      error,
      refetch
    } = useQuery({
      queryKey: ['matches', 'list', stageId, currentPage, pageSize],
      queryFn: async () => {
        if (!stageId) return { matches: [], totalCount: 0, pageCount: 0 };
        const result = await getMatchesByStageId(stageId, { page: currentPage, pageSize });
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      enabled: !!stageId,
      staleTime: 30000, // Data stays fresh for 30 seconds
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false
    });
    
    // Create match mutation
    const createMutation = useMutation({
      mutationFn: async ({ data, participantTeamIds }: { data: MatchInsert; participantTeamIds?: string[] }) => {
        const result = await createMatchAction(data, participantTeamIds);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        toast.success('Match created successfully');
      },
      onError: (error) => {
        toast.error(`Failed to create match: ${error.message}`);
      }
    });
    
    // Update match mutation
    const updateMutation = useMutation({
      mutationFn: async (data: MatchUpdate & { id: number }) => {
        const result = await updateMatchByIdAction(data);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        toast.success('Match updated successfully');
      },
      onError: (error) => {
        toast.error(`Failed to update match: ${error.message}`);
      }
    });
    
    // Delete match mutation
    const deleteMutation = useMutation({
      mutationFn: async (id: number) => {
        const result = await deleteMatchByIdAction(id);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        toast.success('Match deleted successfully');
      },
      onError: (error) => {
        toast.error(`Failed to delete match: ${error.message}`);
      }
    });
    
    return {
        // Data
        matches: matchesData?.matches || [] as MatchWithFullDetails[],
        totalCount: matchesData?.totalCount || 0,
        pageCount: matchesData?.pageCount || 0,
        currentPage,
        pageSize,
        
        // Loading states
        loading: isLoading,
        tableBodyLoading: isLoading,
        error: error?.message || null,
        
        // Mutation handlers
        createMatch: (data: MatchInsert, participantTeamIds?: string[]) => {
            createMutation.mutate({ data, participantTeamIds });
        },
        updateMatch: (data: MatchUpdate & { id: number }) => {
            updateMutation.mutate(data);
        },
        deleteMatch: (id: number) => {
            deleteMutation.mutate(id);
        },
        
        // Mutation states
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        
        // Pagination handlers
        onPageChange: (page: number) => {
            setCurrentPage(page);
        },
        onPageSizeChange: (size: number) => {
            setPageSize(size);
            setCurrentPage(1);
        },
        onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => {
            console.log('onSortChange called', sortBy, sortOrder);
        },
        onSearchChange: (search: string) => {
            console.log('onSearchChange called', search);
        },
        onFiltersChange: (filters: Record<string, unknown>) => {
            console.log('onFiltersChange called', filters);
        },
        
        // Refetch
        refetch
    };
}

export function useMatchesBySchoolId(schoolId: string, options?: { limit?: number; season_id?: number; direction?: 'past' | 'future' }) {
    // Stub - returns empty data until proper implementation
    return {
        data: [] as MatchWithFullDetails[],
        isLoading: false
    };
}

export function useMatchRefetch() {
    const queryClient = useQueryClient();
    
    const refetchAllMatchData = async () => {
        await queryClient.invalidateQueries({ queryKey: matchKeys.all });
    };
    
    return { refetchAllMatchData };
}

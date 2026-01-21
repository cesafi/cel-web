import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMatchById } from '@/actions/matches';
import { MatchWithFullDetails, MatchUpdate } from '@/lib/types/matches';
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
    // Stub implementation with correct return type
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const queryClient = useQueryClient();
    
    return {
        // Data
        matches: [] as MatchWithFullDetails[],
        totalCount: 0,
        pageCount: 0,
        currentPage: 1,
        pageSize: 10,
        
        // Loading states
        loading: false,
        tableBodyLoading: false,
        error: null as string | null,
        
        // Mutation handlers (stubs)
        createMatch: (data: any, participantTeamIds?: string[]) => {
            console.log('createMatch stub called', data, participantTeamIds);
        },
        updateMatch: (data: MatchUpdate) => {
            console.log('updateMatch stub called', data);
        },
        deleteMatch: (id: number) => {
            console.log('deleteMatch stub called', id);
        },
        
        // Mutation states
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        
        // Pagination handlers
        onPageChange: (page: number) => {
            console.log('onPageChange stub called', page);
        },
        onPageSizeChange: (size: number) => {
            console.log('onPageSizeChange stub called', size);
        },
        onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => {
            console.log('onSortChange stub called', sortBy, sortOrder);
        },
        onSearchChange: (search: string) => {
            console.log('onSearchChange stub called', search);
        },
        onFiltersChange: (filters: Record<string, unknown>) => {
            console.log('onFiltersChange stub called', filters);
        },
        
        // Refetch
        refetch: () => {
            console.log('refetch stub called');
        }
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

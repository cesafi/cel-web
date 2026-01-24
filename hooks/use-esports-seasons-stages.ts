import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllEsportsSeasonsStages,
  createEsportsSeasonsStage,
  updateEsportsSeasonsStage,
  deleteEsportsSeasonsStage
} from '@/actions/esports-seasons-stages';
import { Database } from '@/database.types';
import { toast } from 'sonner';

type EsportsSeasonStageInsert = Database['public']['Tables']['esports_seasons_stages']['Insert'];
type EsportsSeasonStageUpdate = Database['public']['Tables']['esports_seasons_stages']['Update'];

export const esportsSeasonStageKeys = {
  all: ['esports-seasons-stages'] as const,
};

export function useAllEsportsSeasonsStages() {
  return useQuery({
    queryKey: esportsSeasonStageKeys.all,
    queryFn: async () => {
      const result = await getAllEsportsSeasonsStages();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useLeagueStagesTable() {
  const queryClient = useQueryClient();

  const { data: stages = [], isLoading, error, refetch } = useQuery({
    queryKey: esportsSeasonStageKeys.all,
    queryFn: async () => {
      const result = await getAllEsportsSeasonsStages();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EsportsSeasonStageInsert) => {
      const result = await createEsportsSeasonsStage(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create league stage');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('League stage created successfully');
      queryClient.invalidateQueries({ queryKey: esportsSeasonStageKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EsportsSeasonStageUpdate }) => {
      const result = await updateEsportsSeasonsStage(id, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update league stage');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('League stage updated successfully');
      queryClient.invalidateQueries({ queryKey: esportsSeasonStageKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteEsportsSeasonsStage(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete league stage');
      }
    },
    onSuccess: () => {
      toast.success('League stage deleted successfully');
      queryClient.invalidateQueries({ queryKey: esportsSeasonStageKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return {
    stages,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    createStage: createMutation.mutate,
    updateStage: updateMutation.mutate,
    deleteStage: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}


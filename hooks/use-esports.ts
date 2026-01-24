import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllEsports, 
  getAllEsportCategories, 
  createEsport, 
  updateEsport, 
  deleteEsport,
  createEsportCategory,
  updateEsportCategory,
  deleteEsportCategory
} from '@/actions/esports';
import { EsportInsert, EsportUpdate } from '@/lib/types/esports';
import { toast } from 'sonner';

export const esportKeys = {
  all: ['esports'] as const,
  categories: ['esports', 'categories'] as const,
};

export function useAllEsports() {
  return useQuery({
    queryKey: esportKeys.all,
    queryFn: async () => {
      const result = await getAllEsports();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useAllEsportCategories() {
  return useQuery({
    queryKey: esportKeys.categories,
    queryFn: async () => {
      const result = await getAllEsportCategories();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useEsportsTable() {
  const queryClient = useQueryClient();
  
  const { data: esports = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: esportKeys.all,
    queryFn: async () => {
      const result = await getAllEsports();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EsportInsert) => {
      const result = await createEsport(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create esport');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Esport created successfully');
      queryClient.invalidateQueries({ queryKey: esportKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EsportUpdate }) => {
      const result = await updateEsport(id, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update esport');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Esport updated successfully');
      queryClient.invalidateQueries({ queryKey: esportKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteEsport(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete esport');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Esport deleted successfully');
      queryClient.invalidateQueries({ queryKey: esportKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return {
    esports,
    loading,
    error: error?.message || null,
    refetch,
    createEsport: createMutation.mutate,
    updateEsport: updateMutation.mutate,
    deleteEsport: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

type CategoryInsert = { esport_id: number; division: string; levels: string };
type CategoryUpdate = { esport_id?: number; division?: string; levels?: string };

export function useCategoriesTable() {
  const queryClient = useQueryClient();
  
  const { data: categories = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: esportKeys.categories,
    queryFn: async () => {
      const result = await getAllEsportCategories();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoryInsert) => {
      const result = await createEsportCategory(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create category');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: esportKeys.categories });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryUpdate }) => {
      const result = await updateEsportCategory(id, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update category');
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: esportKeys.categories });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteEsportCategory(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete category');
      }
    },
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: esportKeys.categories });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return {
    categories,
    loading,
    error: error?.message || null,
    refetch,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}


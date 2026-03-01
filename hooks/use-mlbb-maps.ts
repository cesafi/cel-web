import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getMlbbMaps,
  getActiveMlbbMaps,
  getMlbbMapById,
  createMlbbMap,
  updateMlbbMap,
  deleteMlbbMap
} from '@/actions/mlbb-maps';
import { MlbbMapInsert, MlbbMapUpdate, MlbbMap } from '@/lib/types/mlbb-maps';

export const mlbbMapKeys = {
  all: ['mlbb-maps'] as const,
  active: ['mlbb-maps-active'] as const,
  detail: (id: number) => ['mlbb-maps', id] as const,
};

export function useAllMlbbMaps() {
  return useQuery({
    queryKey: mlbbMapKeys.all,
    queryFn: async () => {
      const result = await getMlbbMaps();
      if (!result.success) throw new Error(result.error);
      return result.data as MlbbMap[];
    },
  });
}

export function useActiveMlbbMaps() {
  return useQuery({
    queryKey: mlbbMapKeys.active,
    queryFn: async () => {
      const result = await getActiveMlbbMaps();
      if (!result.success) throw new Error(result.error);
      return result.data as MlbbMap[];
    },
  });
}

export function useMlbbMapById(id: number) {
  return useQuery({
    queryKey: mlbbMapKeys.detail(id),
    queryFn: async () => {
      const result = await getMlbbMapById(id);
      if (!result.success) throw new Error(result.error);
      return result.data as MlbbMap;
    },
    enabled: !!id,
  });
}

export function useCreateMlbbMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MlbbMapInsert) => {
      const result = await createMlbbMap(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mlbbMapKeys.all });
      queryClient.invalidateQueries({ queryKey: mlbbMapKeys.active });
      toast.success('MLBB Map created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create map');
    },
  });
}

export function useUpdateMlbbMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MlbbMapUpdate & { id: number }) => {
      const result = await updateMlbbMap(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mlbbMapKeys.all });
      queryClient.invalidateQueries({ queryKey: mlbbMapKeys.active });
      if (data) {
        queryClient.invalidateQueries({ queryKey: mlbbMapKeys.detail(data.id) });
      }
      toast.success('MLBB Map updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update map');
    },
  });
}

export function useDeleteMlbbMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteMlbbMap(id);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mlbbMapKeys.all });
      queryClient.invalidateQueries({ queryKey: mlbbMapKeys.active });
      toast.success('MLBB Map deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete map');
    },
  });
}

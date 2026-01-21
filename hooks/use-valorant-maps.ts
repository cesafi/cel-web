import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllValorantMaps,
  getActiveValorantMaps,
  getValorantMapById,
  createValorantMap,
  updateValorantMapById,
  deleteValorantMapById
} from '@/actions/valorant-maps';
import { ValorantMapInsert, ValorantMapUpdate } from '@/lib/types/valorant-maps';
import { toast } from 'sonner';

export const valorantMapKeys = {
  all: ['valorant-maps'] as const,
  active: ['valorant-maps', 'active'] as const,
  details: (id: number) => [...valorantMapKeys.all, id] as const
};

export function useAllValorantMaps() {
  return useQuery({
    queryKey: valorantMapKeys.all,
    queryFn: getAllValorantMaps,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch maps.');
      return data.data;
    }
  });
}

export function useActiveValorantMaps() {
  return useQuery({
    queryKey: valorantMapKeys.active,
    queryFn: getActiveValorantMaps,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch maps.');
      return data.data;
    }
  });
}

export function useValorantMapById(id: number) {
  return useQuery({
    queryKey: valorantMapKeys.details(id),
    queryFn: () => getValorantMapById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Map not found.');
      return data.data;
    }
  });
}

export function useCreateValorantMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ValorantMapInsert) => createValorantMap(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: valorantMapKeys.all });
        toast.success('Map created successfully');
      } else {
        toast.error(result.error || 'Failed to create map');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useUpdateValorantMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ValorantMapUpdate) => updateValorantMapById(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: valorantMapKeys.all });
        toast.success('Map updated successfully');
      } else {
        toast.error(result.error || 'Failed to update map');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteValorantMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteValorantMapById(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: valorantMapKeys.all });
        toast.success('Map deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete map');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

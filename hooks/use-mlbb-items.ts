import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllMlbbItems,
  getActiveMlbbItems,
  getMlbbItemById,
  createMlbbItem,
  updateMlbbItemById,
  deleteMlbbItemById
} from '@/actions/mlbb-items';
import { MlbbItemInsert, MlbbItemUpdate } from '@/lib/types/mlbb-items';
import { toast } from 'sonner';

export const mlbbItemKeys = {
  all: ['mlbb-items'] as const,
  active: ['mlbb-items', 'active'] as const,
  details: (id: number) => [...mlbbItemKeys.all, id] as const
};

export function useAllMlbbItems() {
  return useQuery({
    queryKey: mlbbItemKeys.all,
    queryFn: getAllMlbbItems,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch items.');
      return data.data;
    }
  });
}

export function useActiveMlbbItems() {
  return useQuery({
    queryKey: mlbbItemKeys.active,
    queryFn: getActiveMlbbItems,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch items.');
      return data.data;
    }
  });
}

export function useMlbbItemById(id: number) {
  return useQuery({
    queryKey: mlbbItemKeys.details(id),
    queryFn: () => getMlbbItemById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Item not found.');
      return data.data;
    }
  });
}

export function useCreateMlbbItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MlbbItemInsert) => createMlbbItem(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: mlbbItemKeys.all });
        toast.success('Item created successfully');
      } else {
        toast.error(result.error || 'Failed to create item');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useUpdateMlbbItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MlbbItemUpdate) => updateMlbbItemById(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: mlbbItemKeys.all });
        toast.success('Item updated successfully');
      } else {
        toast.error(result.error || 'Failed to update item');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteMlbbItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMlbbItemById(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: mlbbItemKeys.all });
        toast.success('Item deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete item');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

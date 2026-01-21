import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getValorantMapVetoesByMatchId,
  getValorantMapVetoById,
  createValorantMapVeto,
  createValorantMapVetoes,
  updateValorantMapVetoById,
  deleteValorantMapVetoById,
  deleteValorantMapVetoesByMatchId
} from '@/actions/valorant-map-vetoes';
import { ValorantMapVetoInsert, ValorantMapVetoUpdate } from '@/lib/types/valorant-map-vetoes';
import { toast } from 'sonner';

export const valorantMapVetoKeys = {
  all: ['valorant-map-vetoes'] as const,
  byMatch: (matchId: number) => [...valorantMapVetoKeys.all, 'byMatch', matchId] as const,
  details: (id: string) => [...valorantMapVetoKeys.all, id] as const
};

export function useValorantMapVetoesByMatchId(matchId: number) {
  return useQuery({
    queryKey: valorantMapVetoKeys.byMatch(matchId),
    queryFn: () => getValorantMapVetoesByMatchId(matchId),
    enabled: !!matchId,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch vetoes.');
      return data.data;
    }
  });
}

export function useValorantMapVetoById(id: string) {
  return useQuery({
    queryKey: valorantMapVetoKeys.details(id),
    queryFn: () => getValorantMapVetoById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Veto not found.');
      return data.data;
    }
  });
}

export function useCreateValorantMapVeto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ValorantMapVetoInsert) => createValorantMapVeto(data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: valorantMapVetoKeys.byMatch(variables.match_id) });
        toast.success('Veto recorded successfully');
      } else {
        toast.error(result.error || 'Failed to record veto');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useCreateValorantMapVetoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ValorantMapVetoInsert[]) => createValorantMapVetoes(data),
    onSuccess: (result, variables) => {
      if (result.success) {
        if (variables.length > 0) {
          queryClient.invalidateQueries({ queryKey: valorantMapVetoKeys.byMatch(variables[0].match_id) });
        }
        toast.success('Vetoes recorded successfully');
      } else {
        toast.error(result.error || 'Failed to record vetoes');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useUpdateValorantMapVeto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ValorantMapVetoUpdate) => updateValorantMapVetoById(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: valorantMapVetoKeys.all });
        toast.success('Veto updated successfully');
      } else {
        toast.error(result.error || 'Failed to update veto');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteValorantMapVeto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteValorantMapVetoById(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: valorantMapVetoKeys.all });
        toast.success('Veto deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete veto');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteValorantMapVetoesByMatchId() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: number) => deleteValorantMapVetoesByMatchId(matchId),
    onSuccess: (result, matchId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: valorantMapVetoKeys.byMatch(matchId) });
        toast.success('All vetoes deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete vetoes');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

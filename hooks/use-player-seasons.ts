import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllPlayerSeasons,
  getPlayerSeasonsBySeasonId,
  getPlayerSeasonsByPlayerId,
  getPlayerSeasonById,
  createPlayerSeason,
  updatePlayerSeasonById,
  deletePlayerSeasonById
} from '@/actions/player-seasons';
import { PlayerSeasonInsert, PlayerSeasonUpdate } from '@/lib/types/player-seasons';
import { toast } from 'sonner';

export const playerSeasonKeys = {
  all: ['player-seasons'] as const,
  bySeason: (seasonId: number) => [...playerSeasonKeys.all, 'bySeason', seasonId] as const,
  byPlayer: (playerId: string) => [...playerSeasonKeys.all, 'byPlayer', playerId] as const,
  details: (id: number) => [...playerSeasonKeys.all, id] as const
};

export function useAllPlayerSeasons() {
  return useQuery({
    queryKey: playerSeasonKeys.all,
    queryFn: getAllPlayerSeasons,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch player seasons.');
      return data.data;
    }
  });
}

export function usePlayerSeasonsBySeasonId(seasonId: number) {
  return useQuery({
    queryKey: playerSeasonKeys.bySeason(seasonId),
    queryFn: () => getPlayerSeasonsBySeasonId(seasonId),
    enabled: !!seasonId,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch player seasons.');
      return data.data;
    }
  });
}

export function usePlayerSeasonsByPlayerId(playerId: string) {
  return useQuery({
    queryKey: playerSeasonKeys.byPlayer(playerId),
    queryFn: () => getPlayerSeasonsByPlayerId(playerId),
    enabled: !!playerId,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch player seasons.');
      return data.data;
    }
  });
}

export function usePlayerSeasonById(id: number) {
  return useQuery({
    queryKey: playerSeasonKeys.details(id),
    queryFn: () => getPlayerSeasonById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Player season not found.');
      return data.data;
    }
  });
}

export function useCreatePlayerSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlayerSeasonInsert) => createPlayerSeason(data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: playerSeasonKeys.all });
        queryClient.invalidateQueries({ queryKey: playerSeasonKeys.byPlayer(variables.player_id) });
        toast.success('Player season created successfully');
      } else {
        toast.error(result.error || 'Failed to create player season');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useUpdatePlayerSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlayerSeasonUpdate) => updatePlayerSeasonById(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: playerSeasonKeys.all });
        toast.success('Player season updated successfully');
      } else {
        toast.error(result.error || 'Failed to update player season');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeletePlayerSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePlayerSeasonById(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: playerSeasonKeys.all });
        toast.success('Player season deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete player season');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

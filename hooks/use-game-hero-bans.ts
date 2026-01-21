import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGameHeroBansByGameId,
  getGameHeroBanById,
  createGameHeroBan,
  createGameHeroBans,
  updateGameHeroBanById,
  deleteGameHeroBanById,
  deleteGameHeroBansByGameId
} from '@/actions/game-hero-bans';
import { GameHeroBanInsert, GameHeroBanUpdate } from '@/lib/types/game-hero-bans';
import { toast } from 'sonner';

export const gameHeroBanKeys = {
  all: ['game-hero-bans'] as const,
  byGame: (gameId: number) => [...gameHeroBanKeys.all, 'byGame', gameId] as const,
  details: (id: string) => [...gameHeroBanKeys.all, id] as const
};

export function useGameHeroBansByGameId(gameId: number) {
  return useQuery({
    queryKey: gameHeroBanKeys.byGame(gameId),
    queryFn: () => getGameHeroBansByGameId(gameId),
    enabled: !!gameId,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch bans.');
      return data.data;
    }
  });
}

export function useGameHeroBanById(id: string) {
  return useQuery({
    queryKey: gameHeroBanKeys.details(id),
    queryFn: () => getGameHeroBanById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Ban not found.');
      return data.data;
    }
  });
}

export function useCreateGameHeroBan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GameHeroBanInsert) => createGameHeroBan(data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameHeroBanKeys.byGame(variables.game_id) });
        toast.success('Ban recorded successfully');
      } else {
        toast.error(result.error || 'Failed to record ban');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useCreateGameHeroBans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GameHeroBanInsert[]) => createGameHeroBans(data),
    onSuccess: (result, variables) => {
      if (result.success) {
        if (variables.length > 0) {
          queryClient.invalidateQueries({ queryKey: gameHeroBanKeys.byGame(variables[0].game_id) });
        }
        toast.success('Bans recorded successfully');
      } else {
        toast.error(result.error || 'Failed to record bans');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useUpdateGameHeroBan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GameHeroBanUpdate) => updateGameHeroBanById(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameHeroBanKeys.all });
        toast.success('Ban updated successfully');
      } else {
        toast.error(result.error || 'Failed to update ban');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteGameHeroBan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGameHeroBanById(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameHeroBanKeys.all });
        toast.success('Ban deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete ban');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteGameHeroBansByGameId() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gameId: number) => deleteGameHeroBansByGameId(gameId),
    onSuccess: (result, gameId) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameHeroBanKeys.byGame(gameId) });
        toast.success('All bans deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete bans');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

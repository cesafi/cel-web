import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllGameCharacters,
  getAllGameCharactersWithEsport,
  getGameCharactersByEsportId,
  getGameCharacterById,
  createGameCharacter,
  updateGameCharacterById,
  deleteGameCharacterById
} from '@/actions/game-characters';
import { GameCharacterInsert, GameCharacterUpdate } from '@/lib/types/game-characters';
import { toast } from 'sonner';

export const gameCharacterKeys = {
  all: ['game-characters'] as const,
  withEsport: ['game-characters', 'withEsport'] as const,
  byEsport: (esportId: number) => [...gameCharacterKeys.all, 'byEsport', esportId] as const,
  details: (id: number) => [...gameCharacterKeys.all, id] as const
};

export function useAllGameCharacters() {
  return useQuery({
    queryKey: gameCharacterKeys.all,
    queryFn: getAllGameCharacters,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch characters.');
      return data.data;
    }
  });
}

export function useAllGameCharactersWithEsport() {
  return useQuery({
    queryKey: gameCharacterKeys.withEsport,
    queryFn: getAllGameCharactersWithEsport,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch characters.');
      return data.data;
    }
  });
}

export function useGameCharactersByEsportId(esportId: number) {
  return useQuery({
    queryKey: gameCharacterKeys.byEsport(esportId),
    queryFn: () => getGameCharactersByEsportId(esportId),
    enabled: !!esportId,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch characters.');
      return data.data;
    }
  });
}

export function useGameCharacterById(id: number) {
  return useQuery({
    queryKey: gameCharacterKeys.details(id),
    queryFn: () => getGameCharacterById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Character not found.');
      return data.data;
    }
  });
}

export function useCreateGameCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GameCharacterInsert) => createGameCharacter(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameCharacterKeys.all });
        toast.success('Character created successfully');
      } else {
        toast.error(result.error || 'Failed to create character');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useUpdateGameCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GameCharacterUpdate) => updateGameCharacterById(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameCharacterKeys.all });
        toast.success('Character updated successfully');
      } else {
        toast.error(result.error || 'Failed to update character');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteGameCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteGameCharacterById(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameCharacterKeys.all });
        toast.success('Character deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete character');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

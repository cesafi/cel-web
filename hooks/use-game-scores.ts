import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGameScoresByGameId, createGameScore, updateGameScore } from '@/actions/game-scores';
import { matchKeys } from '@/hooks/use-matches';
import { GameScoreInsert, GameScoreUpdate } from '@/lib/types/game-scores';
import { toast } from 'sonner';

export const gameScoreKeys = {
  all: ['game-scores'] as const,
  byGameId: (gameId: number) => [...gameScoreKeys.all, 'game', gameId] as const,
};

export function useGameScoresByGameId(gameId: number) {
  return useQuery({
    queryKey: gameScoreKeys.byGameId(gameId),
    queryFn: async () => {
      const result = await getGameScoresByGameId(gameId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!gameId,
  });
}

export function useCreateGameScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GameScoreInsert) => {
      const result = await createGameScore(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gameScoreKeys.byGameId(variables.game_id) });
      queryClient.invalidateQueries({ queryKey: matchKeys.all });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create game score');
    },
  });
}

export function useUpdateGameScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GameScoreUpdate) => {
      const result = await updateGameScore(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries if needed. Since we don't know the game_id directly from update data sometimes if it's optional,
      // but in our schema usually we pass it or we invalidate all if critical.
      // Ideally we should know the game_id to minimize invalidation, but for now we might rely on parent component refetching or broader invalidation if needed.
      // However, looking at the usage in MatchGamesTable, `refetch` is called manually on the games table which might cascade, but specifically for scores inside the modal:
      // The modal uses `gameScores` from `useGameScoresByGameId`.
      // The `variables` for update might contain `game_id` if we pass it, but if `GameScoreUpdate` makes it optional (which it does), we might miss it.
      // Re-checking `GameScoreUpdate` schema: `game_id` is optional.
      // But typically when updating we might want to refresh the list.
      if (variables.game_id) {
         queryClient.invalidateQueries({ queryKey: gameScoreKeys.byGameId(variables.game_id) });
      } else {
         // Fallback or just invalidate all game scores if we can't narrow it down, 
         // OR trust that the caller will handle refetching if they know the context.
         // Given the usage in `handleSaveScores` in `match-games-table.tsx`, `refetch()` is called there which invalidates `gameKeys.byMatch`.
         // But the modal itself displays scores. `handleSaveScores` closes the modal immediately after success, so optimistic update or simple refetch is fine.
         // Actually `handleSaveScores` closes the modal, so we don't strictly need to refetch the scores query since the modal is gone.
         // But for correctness let's try to invalidate if possible.
         queryClient.invalidateQueries({ queryKey: gameScoreKeys.all });
      }
      queryClient.invalidateQueries({ queryKey: matchKeys.all });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update game score');
    },
  });
}

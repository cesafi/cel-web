import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getGameDraftActionsByGameId,
  submitGameDraftAction,
  resetGameDraft,
  undoLastGameDraftAction,
  lockGameDraftAction
} from '@/actions/game-draft';

import { GameDraftAction, GameDraftActionInsert } from '@/lib/types/game-draft';
import { ServiceResponse } from '@/lib/types/base';

export const gameDraftKeys = {
  all: ['game_draft_actions'] as const,
  byGame: (gameId: number) => [...gameDraftKeys.all, gameId] as const,
};

export function useGameDraftActions(
  gameId: number,
  queryOptions?: UseQueryOptions<ServiceResponse<GameDraftAction[]>, Error, GameDraftAction[]>
) {
  return useQuery({
    queryKey: gameDraftKeys.byGame(gameId),
    queryFn: () => getGameDraftActionsByGameId(gameId),
    enabled: !!gameId,
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || `Failed to fetch draft actions for game ${gameId}.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useSubmitGameDraftAction(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, GameDraftActionInsert>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitGameDraftAction,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        if (variables.game_id) {
          queryClient.invalidateQueries({ queryKey: gameDraftKeys.byGame(variables.game_id) });
        }
      } else {
        toast.error(result.error || 'Failed to submit action');
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to submit draft action:', error);
      toast.error('Failed to submit action');
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useResetGameDraft(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, number>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetGameDraft,
    onSuccess: (result, gameId, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameDraftKeys.byGame(gameId) });
        toast.success('Draft reset');
      } else {
        toast.error(result.error || 'Failed to reset draft');
      }
      (mutationOptions?.onSuccess as any)?.(result, gameId, context);
    },
    onError: (error, gameId, context) => {
      console.error('Failed to reset draft:', error);
      toast.error('Failed to reset draft');
      (mutationOptions?.onError as any)?.(error, gameId, context);
    },
    ...mutationOptions
  });
}

export function useUndoLastGameDraftAction(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, number>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: undoLastGameDraftAction,
    onSuccess: (result, gameId, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameDraftKeys.byGame(gameId) });
        toast.success('Undid last action');
      } else {
        toast.error(result.error || 'Failed to undo action');
      }
      (mutationOptions?.onSuccess as any)?.(result, gameId, context);
    },
    onError: (error, gameId, context) => {
      console.error('Failed to undo last action:', error);
      toast.error('Failed to undo action');
      (mutationOptions?.onError as any)?.(error, gameId, context);
    },
    ...mutationOptions
  });
}

export function useLockGameDraftAction(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, { actionId: string; gameId: number }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId }) => lockGameDraftAction(actionId),
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: gameDraftKeys.byGame(variables.gameId) });
      } else {
         toast.error(result.error || 'Failed to lock action');
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
       console.error('Failed to lock action:', error);
       toast.error('Failed to lock action');
       (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

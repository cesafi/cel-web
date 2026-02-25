import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { GameDraftAction } from '@/lib/types/game-draft';

export function useRealtimeDraft(
  gameId: number, 
  onActionCallback: (payload: any) => void
) {
  useEffect(() => {
    if (!gameId) return;

    const supabase = getSupabaseClient();
    
    // Subscribe to all changes for this game's draft actions AND rosters
    const channel = supabase
      .channel(`draft-room:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'game_draft_actions',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          onActionCallback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rosters',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          onActionCallback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, onActionCallback]);
}

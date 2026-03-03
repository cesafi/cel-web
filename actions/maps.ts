'use server';

import { getSupabaseServer } from '@/lib/supabase/server';

export async function getValorantMapById(id: number) {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('valorant_maps')
      .select('id, name, splash_image_url')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true as const, data };
  } catch {
    return { success: false as const, error: 'Failed to fetch Valorant map' };
  }
}

export async function getMlbbMapById(id: number) {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('mlbb_maps')
      .select('id, name, splash_image_url')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true as const, data };
  } catch {
    return { success: false as const, error: 'Failed to fetch MLBB map' };
  }
}

export async function getGameScoresByGameId(gameId: number) {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('game_scores')
      .select('*, match_participants(team_id, schools_teams(id, name, schools(abbreviation, logo_url)))')
      .eq('game_id', gameId);

    if (error) throw error;
    return { success: true as const, data: data || [] };
  } catch {
    return { success: false as const, error: 'Failed to fetch game scores' };
  }
}

import { getSupabaseServer } from '@/lib/supabase/server';
import { ServiceResponse } from '@/lib/types/base';

export class ActiveApiExportService {
    static async getAll(): Promise<ServiceResponse<any[]>> {
        const supabase = await getSupabaseServer();
        const { data, error } = await supabase
            .from('active_api_exports')
            .select('*')
            .order('title', { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    }

    static async getActiveGameId(title: 'draft' | 'game-results'): Promise<ServiceResponse<number>> {
        const supabase = await getSupabaseServer();
        const { data, error } = await supabase
            .from('active_api_exports')
            .select('game_id')
            .eq('title', title)
            .single();

        if (error || !data || !data.game_id) {
            return { success: false, error: error?.message || 'No active game configured' };
        }

        return { success: true, data: data.game_id };
    }

    static async getActiveMatchId(title: 'valorant-map-veto'): Promise<ServiceResponse<number>> {
        const supabase = await getSupabaseServer();
        const { data, error } = await supabase
            .from('active_api_exports')
            .select('match_id')
            .eq('title', title)
            .single();

        if (error || !data || !data.match_id) {
            return { success: false, error: error?.message || 'No active match configured' };
        }

        return { success: true, data: data.match_id };
    }

    static async setActiveGameId(title: 'draft' | 'game-results', gameId: number): Promise<ServiceResponse<any>> {
        const supabase = await getSupabaseServer();
        const { data, error } = await supabase
            .from('active_api_exports')
            .update({ game_id: gameId })
            .eq('title', title)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    }

    static async setActiveMatchId(title: 'valorant-map-veto', matchId: number): Promise<ServiceResponse<any>> {
        const supabase = await getSupabaseServer();
        const { data, error } = await supabase
            .from('active_api_exports')
            .update({ match_id: matchId })
            .eq('title', title)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    }
}

import { getSupabaseServer } from '@/lib/supabase/server';
import { ServiceResponse } from '@/lib/types/base';

export class ActiveApiExportService {
    private static async getClient() {
        return await getSupabaseServer();
    }

    static async getAll(): Promise<ServiceResponse<any[]>> {
        const supabase = await this.getClient();
        const { data, error } = await supabase
            .from('active_api_exports')
            .select('*')
            .order('title', { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    }

    static async getByTitle(title: string): Promise<ServiceResponse<any>> {
        const supabase = await this.getClient();
        const { data, error } = await supabase
            .from('active_api_exports')
            .select('*')
            .eq('title', title)
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    }

    static async updateByTitle(title: string, updates: { 
        game_id?: number | null; 
        match_id?: number | null; 
        query_params?: any;
        base_url?: string | null;
    }): Promise<ServiceResponse<any>> {
        const supabase = await this.getClient();
        const { data, error } = await supabase
            .from('active_api_exports')
            .update(updates)
            .eq('title', title)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    }

    static async getActiveGameId(title: 'draft' | 'game-results'): Promise<ServiceResponse<number>> {
        const result = await this.getByTitle(title);
        if (!result.success || !result.data?.game_id) {
            return { success: false, error: result.error || 'No active game configured' };
        }
        return { success: true, data: result.data.game_id };
    }

    static async getActiveMatchId(title: 'valorant-map-veto'): Promise<ServiceResponse<number>> {
        const result = await this.getByTitle(title);
        if (!result.success || !result.data?.match_id) {
            return { success: false, error: result.error || 'No active match configured' };
        }
        return { success: true, data: result.data.match_id };
    }

    static async setActiveGameId(title: 'draft' | 'game-results', gameId: number): Promise<ServiceResponse<any>> {
        return this.updateByTitle(title, { game_id: gameId });
    }

    static async setActiveMatchId(title: 'valorant-map-veto', matchId: number): Promise<ServiceResponse<any>> {
        return this.updateByTitle(title, { match_id: matchId });
    }
}

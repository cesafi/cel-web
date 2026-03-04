import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { StatisticsService } from '@/services/statistics';
import { row, emptyRow, fmt, pct, csvHeaders } from '@/lib/utils/csv-helpers';

const N = 'None';

/**
 * Export: Head-to-Head Player Comparison CSV — 15 columns (A–O)
 * Side-by-side layout for two players
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const playerA = searchParams.get('playerA');
        const playerB = searchParams.get('playerB');
        const game = (searchParams.get('game') || 'mlbb') as 'mlbb' | 'valorant';
        const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;

        if (!playerA || !playerB) {
            return NextResponse.json({ error: 'Both playerA and playerB are required' }, { status: 400 });
        }

        const supabase = await getSupabaseServer();
        const isMlbb = game === 'mlbb';
        const title = isMlbb ? 'MLBB HEAD-TO-HEAD PLAYERS' : 'VALORANT HEAD-TO-HEAD PLAYERS';
        const statsTable = game === 'mlbb' ? 'stats_mlbb_game_player' : 'stats_valorant_game_player';

        // Get player info
        const { data: playersInfo } = await supabase
            .from('players')
            .select('id, ign, first_name, last_name, role')
            .in('id', [playerA, playerB]);

        const pA = (playersInfo || []).find((p: any) => p.id === playerA);
        const pB = (playersInfo || []).find((p: any) => p.id === playerB);
        const ignA = pA?.ign || N;
        const ignB = pB?.ign || N;

        // Direct H2H — find common games
        const { data: gamesA } = await supabase.from(statsTable).select('game_id').eq('player_id', playerA);
        const { data: gamesB } = await supabase.from(statsTable).select('game_id').eq('player_id', playerB);
        const gameIdsA = new Set((gamesA || []).map(g => g.game_id));
        const commonGameIds = (gamesB || []).map(g => g.game_id).filter(id => gameIdsA.has(id));

        let directA: any = null, directB: any = null;
        if (commonGameIds.length > 0) {
            const { data: statsA } = await supabase.from(statsTable).select('*').eq('player_id', playerA).in('game_id', commonGameIds);
            const { data: statsB } = await supabase.from(statsTable).select('*').eq('player_id', playerB).in('game_id', commonGameIds);

            const agg = (rows: any[]) => {
                const g = rows.length;
                const k = rows.reduce((s, r) => s + (r.kills || 0), 0);
                const d = rows.reduce((s, r) => s + (r.deaths || 0), 0);
                const a = rows.reduce((s, r) => s + (r.assists || 0), 0);
                return { games: g, kills: k, deaths: d, assists: a, kda: d > 0 ? ((k + a) / d).toFixed(2) : (k + a).toFixed(2), mvp: rows.filter(r => r.is_mvp).length };
            };
            directA = agg(statsA || []);
            directB = agg(statsB || []);
        }

        // Overall stats
        const filters = seasonId ? { season_id: seasonId } : undefined;
        const allStats = isMlbb
            ? await StatisticsService.getMlbbPlayerStats(filters)
            : await StatisticsService.getValorantPlayerStats(filters);

        const overallA = allStats.success ? (allStats.data as any[]).find((p: any) => p.player_id === playerA) : null;
        const overallB = allStats.success ? (allStats.data as any[]).find((p: any) => p.player_id === playerB) : null;

        let csv = '';

        // Row 1: Player A ... TITLE ... Player B
        csv += row([ignA, '', '', '', '', '', '', title, '', '', '', '', '', '', ignB]);

        // Row 2: Roles
        csv += row([pA?.role || N, '', '', '', '', '', '', 'HEAD TO HEAD', '', '', '', '', '', '', pB?.role || N]);

        // Row 3: Empty
        csv += emptyRow();

        // Row 4: H2H record
        csv += row([commonGameIds.length, '', '', '', '', '', '', 'H2H GAMES', '', '', '', '', '', '', commonGameIds.length]);

        csv += emptyRow();

        // H2H stats
        const statRow = (label: string, valA: any, valB: any) =>
            row([valA ?? N, '', '', '', '', '', '', label, '', '', '', '', '', '', valB ?? N]);

        csv += row(['', '', '', '', '', '', '', 'DIRECT H2H STATS', '', '', '', '', '', '', '']);
        csv += statRow('KILLS', directA?.kills, directB?.kills);
        csv += statRow('DEATHS', directA?.deaths, directB?.deaths);
        csv += statRow('ASSISTS', directA?.assists, directB?.assists);
        csv += statRow('KDA', directA?.kda, directB?.kda);
        csv += statRow('MVP', directA?.mvp, directB?.mvp);

        csv += emptyRow();

        // Overall stats
        csv += row(['', '', '', '', '', '', '', 'OVERALL STATS', '', '', '', '', '', '', '']);
        csv += statRow('GAMES PLAYED', overallA?.games_played, overallB?.games_played);
        csv += statRow('TOTAL KILLS', overallA?.total_kills, overallB?.total_kills);
        csv += statRow('TOTAL DEATHS', overallA?.total_deaths, overallB?.total_deaths);
        csv += statRow('TOTAL ASSISTS', overallA?.total_assists, overallB?.total_assists);

        const oKdaA = overallA && overallA.total_deaths > 0
            ? ((overallA.total_kills + overallA.total_assists) / overallA.total_deaths).toFixed(2)
            : overallA ? (overallA.total_kills + overallA.total_assists).toFixed(2) : N;
        const oKdaB = overallB && overallB.total_deaths > 0
            ? ((overallB.total_kills + overallB.total_assists) / overallB.total_deaths).toFixed(2)
            : overallB ? (overallB.total_kills + overallB.total_assists).toFixed(2) : N;

        csv += statRow('KDA', oKdaA, oKdaB);
        csv += statRow('MVP COUNT', overallA?.mvp_count, overallB?.mvp_count);

        if (isMlbb) {
            csv += statRow('TOTAL GOLD', overallA?.total_gold, overallB?.total_gold);
            csv += statRow('GPM', overallA ? fmt(overallA.avg_gpm) : N, overallB ? fmt(overallB.avg_gpm) : N);
        } else {
            csv += statRow('AVG ACS', overallA ? fmt(overallA.avg_acs) : N, overallB ? fmt(overallB.avg_acs) : N);
            csv += statRow('FIRST BLOODS', overallA?.total_first_bloods, overallB?.total_first_bloods);
        }

        return new NextResponse(csv, {
            status: 200,
            headers: csvHeaders('h2h-players'),
        });
    } catch (error) {
        console.error('Error generating H2H players CSV:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

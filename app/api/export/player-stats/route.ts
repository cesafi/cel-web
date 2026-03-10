import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { row, emptyRow, fmt, pct, csvHeaders, parseFilters } from '@/lib/utils/csv-helpers';

const MAX_ROWS = 10;
const N = 'None';

/**
 * Export: Player Statistics CSV — 15 columns (A–O)
 * Supports both MLBB and Valorant via ?game= param
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const { game, seasonId, stageId, division } = parseFilters(searchParams);
        const teamId = searchParams.get('teamId') || undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : MAX_ROWS;

        const filters = {
            game,
            season_id: seasonId,
            stage_id: stageId,
            division,
            team_id: teamId,
            limit,
        };

        const result = game === 'mlbb'
            ? await StatisticsService.getMlbbPlayerStats(filters)
            : await StatisticsService.getValorantPlayerStats(filters);

        if (!result.success || !result.data) {
            return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500 });
        }

        const players = (result.data as any[]).slice(0, limit);
        const isMlbb = game === 'mlbb';
        const title = isMlbb ? 'MLBB PLAYER STATISTICS' : 'VALORANT PLAYER STATISTICS';

        let csv = '';

        // Row 1: Title
        csv += row(['', '', '', '', '', '', '', title, '', '', '', '', '', '', '']);

        // Row 2: Column headers
        if (isMlbb) {
            csv += row(['#', 'IGN', 'TEAM', 'GP', 'K', 'D', 'A', 'KDA', 'GOLD', 'GPM', 'DMG', 'WR%', 'MVP', 'RATING', '']);
        } else {
            csv += row(['#', 'IGN', 'TEAM', 'GP', 'K', 'D', 'A', 'KDA', 'ACS', 'ADR', 'HS%', 'FB', 'WR%', 'MVP', '']);
        }

        // Row 3: Empty separator
        csv += emptyRow();

        // Rows 4+: Player data (capped at limit)
        for (let i = 0; i < limit; i++) {
            const p = players[i];
            if (!p) {
                // Filler row
                if (isMlbb) {
                    csv += row([i + 1, N, N, N, N, N, N, N, N, N, N, N, N, N, '']);
                } else {
                    csv += row([i + 1, N, N, N, N, N, N, N, N, N, N, N, N, N, '']);
                }
                continue;
            }

            const kda = p.total_deaths > 0
                ? ((p.total_kills + p.total_assists) / p.total_deaths).toFixed(2)
                : (p.total_kills + p.total_assists).toFixed(2);

            const winRate = p.games_played > 0
                ? ((p.wins / p.games_played) * 100).toFixed(1) + '%'
                : '0%';

            if (isMlbb) {
                csv += row([
                    i + 1,
                    p.player_ign || N,
                    p.school_abbreviation || p.team_name || N,
                    p.games_played ?? 0,
                    p.total_kills ?? 0,
                    p.total_deaths ?? 0,
                    p.total_assists ?? 0,
                    kda,
                    p.total_gold ?? 0,
                    fmt(p.avg_gpm),
                    p.total_damage_dealt ?? 0,
                    winRate,
                    p.mvp_count ?? 0,
                    fmt((p as any).avg_rating ?? (p as any).teamfight_percent, 1),
                    '',
                ]);
            } else {
                csv += row([
                    i + 1,
                    p.player_ign || N,
                    p.school_abbreviation || p.team_name || N,
                    p.games_played ?? 0,
                    p.total_kills ?? 0,
                    p.total_deaths ?? 0,
                    p.total_assists ?? 0,
                    kda,
                    fmt(p.avg_acs),
                    fmt(p.avg_adr),
                    pct(p.avg_hs_percent),
                    p.total_first_bloods ?? 0,
                    winRate,
                    p.mvp_count ?? 0,
                    '',
                ]);
            }
        }

        return new NextResponse(csv, {
            status: 200,
            headers: csvHeaders('player-stats'),
        });
    } catch (error) {
        console.error('Error generating player stats CSV:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

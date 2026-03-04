import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { row, emptyRow, fmt, pct, csvHeaders, parseFilters } from '@/lib/utils/csv-helpers';

const MAX_ROWS = 12;
const N = 'None';

/**
 * Export: Team Statistics CSV — 15 columns (A–O)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const { game, seasonId, stageId, categoryId } = parseFilters(searchParams);
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : MAX_ROWS;

        const result = await StatisticsService.getTeamStats(game, seasonId, stageId, categoryId);

        if (!result.success || !result.data) {
            return NextResponse.json({ error: 'Failed to fetch team stats' }, { status: 500 });
        }

        const teams = (result.data as any[]).slice(0, limit);
        const isMlbb = game === 'mlbb';
        const title = isMlbb ? 'MLBB TEAM STATISTICS' : 'VALORANT TEAM STATISTICS';

        let csv = '';

        // Row 1: Title
        csv += row(['', '', '', '', '', '', '', title, '', '', '', '', '', '', '']);

        // Row 2: Column headers
        if (isMlbb) {
            csv += row(['#', 'TEAM', 'GP', 'W', 'L', 'WR%', 'K', 'D', 'A', 'KDA', 'AVG GOLD', 'AVG DMG', '', '', '']);
        } else {
            csv += row(['#', 'TEAM', 'GP', 'W', 'L', 'WR%', 'K', 'D', 'A', 'KDA', 'AVG ACS', 'FB', '', '', '']);
        }

        // Row 3: Empty
        csv += emptyRow();

        // Data rows
        for (let i = 0; i < limit; i++) {
            const t = teams[i];
            if (!t) {
                csv += row([i + 1, N, N, N, N, N, N, N, N, N, N, N, '', '', '']);
                continue;
            }

            const kda = t.total_deaths > 0
                ? ((t.total_kills + t.total_assists) / t.total_deaths).toFixed(2)
                : (t.total_kills + t.total_assists).toFixed(2);

            if (isMlbb) {
                csv += row([
                    i + 1,
                    t.school_abbreviation || t.team_name || N,
                    t.games_played ?? 0,
                    t.total_wins ?? 0,
                    t.total_losses ?? 0,
                    pct(t.win_rate),
                    t.total_kills ?? 0,
                    t.total_deaths ?? 0,
                    t.total_assists ?? 0,
                    kda,
                    fmt(t.avg_gold_per_game, 0),
                    fmt(t.avg_damage_per_game, 0),
                    '', '', '',
                ]);
            } else {
                csv += row([
                    i + 1,
                    t.school_abbreviation || t.team_name || N,
                    t.games_played ?? 0,
                    t.total_wins ?? 0,
                    t.total_losses ?? 0,
                    pct(t.win_rate),
                    t.total_kills ?? 0,
                    t.total_deaths ?? 0,
                    t.total_assists ?? 0,
                    kda,
                    fmt(t.avg_acs),
                    t.total_first_bloods ?? 0,
                    '', '', '',
                ]);
            }
        }

        return new NextResponse(csv, {
            status: 200,
            headers: csvHeaders('team-stats'),
        });
    } catch (error) {
        console.error('Error generating team stats CSV:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

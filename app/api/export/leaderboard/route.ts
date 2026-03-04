import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { row, emptyRow, fmt, csvHeaders } from '@/lib/utils/csv-helpers';

const MAX_ROWS = 10;
const N = 'None';

/**
 * Export: Player Leaderboard CSV — 15 columns (A–O)
 * Top N players ranked by a specific metric
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const game = (searchParams.get('game') || 'mlbb') as 'mlbb' | 'valorant';
        const metric = searchParams.get('metric') || (game === 'mlbb' ? 'total_kills' : 'avg_acs');
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : MAX_ROWS;
        const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;

        const result = await StatisticsService.getLeaderboard(game, metric, limit, seasonId);

        if (!result.success || !result.data) {
            return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
        }

        const entries = result.data.slice(0, limit);
        const isMlbb = game === 'mlbb';
        const title = isMlbb ? 'MLBB LEADERBOARD' : 'VALORANT LEADERBOARD';
        const metricLabel = metric.replace(/_/g, ' ').toUpperCase();

        let csv = '';

        // Row 1: Title
        csv += row(['', '', '', '', '', '', '', title, '', '', '', '', '', '', '']);

        // Row 2: Metric label
        csv += row(['', '', '', '', '', '', '', metricLabel, '', '', '', '', '', '', '']);

        // Row 3: Empty
        csv += emptyRow();

        // Row 4: Column headers
        csv += row(['#', 'IGN', 'SCHOOL', 'VALUE', '', '', '', '', '', '', '', '', '', '', '']);

        // Row 5: Empty separator
        csv += emptyRow();

        // Rows 6+: Leaderboard entries (capped)
        for (let i = 0; i < limit; i++) {
            const e = entries[i];
            if (!e) {
                csv += row([i + 1, N, N, N, '', '', '', '', '', '', '', '', '', '', '']);
                continue;
            }

            csv += row([
                i + 1,
                e.player_ign || N,
                e.team_name || N,
                fmt(e.value, 2),
                '', '', '', '', '', '', '', '', '', '', '',
            ]);
        }

        return new NextResponse(csv, {
            status: 200,
            headers: csvHeaders('leaderboard'),
        });
    } catch (error) {
        console.error('Error generating leaderboard CSV:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

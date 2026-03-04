import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { row, emptyRow, fmt, pct, csvHeaders } from '@/lib/utils/csv-helpers';

const MAX_ROWS = 7;
const N = 'None';

/**
 * Export: Valorant Map Statistics CSV — 15 columns (A–O)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;
        const stageId = searchParams.get('stageId') ? parseInt(searchParams.get('stageId')!) : undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : MAX_ROWS;

        const result = await StatisticsService.getMapStats(seasonId, stageId);

        if (!result.success || !result.data) {
            return NextResponse.json({ error: 'Failed to fetch map stats' }, { status: 500 });
        }

        const maps = (result.data as any[]).slice(0, limit);

        let csv = '';

        // Row 1: Title
        csv += row(['', '', '', '', '', '', '', 'VALORANT MAP STATISTICS', '', '', '', '', '', '', '']);

        // Row 2: Column headers
        csv += row(['#', 'MAP', 'GAMES', 'PICKS', 'BANS', 'PICK%', 'BAN%', 'ATK WR%', 'DEF WR%', '', '', '', '', '', '']);

        // Row 3: Empty
        csv += emptyRow();

        // Data rows
        for (let i = 0; i < limit; i++) {
            const m = maps[i];
            if (!m) {
                csv += row([i + 1, N, N, N, N, N, N, N, N, '', '', '', '', '', '']);
                continue;
            }

            csv += row([
                i + 1,
                m.map_name || N,
                m.total_games ?? 0,
                m.total_picks ?? 0,
                m.total_bans ?? 0,
                pct(m.pick_rate),
                pct(m.ban_rate),
                pct(m.attack_win_rate),
                pct(m.defense_win_rate),
                '', '', '', '', '', '',
            ]);
        }

        return new NextResponse(csv, {
            status: 200,
            headers: csvHeaders('map-stats'),
        });
    } catch (error) {
        console.error('Error generating map stats CSV:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

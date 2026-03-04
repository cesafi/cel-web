import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { row, emptyRow, fmt, pct, csvHeaders, parseFilters } from '@/lib/utils/csv-helpers';

const MAX_ROWS = 20;
const N = 'None';

/**
 * Export: Hero/Agent Statistics CSV — 15 columns (A–O)
 * Pick/ban rates, win rates, KDA per hero/agent
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const { game, seasonId, stageId, categoryId } = parseFilters(searchParams);
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : MAX_ROWS;

        const isMlbb = game === 'mlbb';
        const result = isMlbb
            ? await StatisticsService.getHeroStats(seasonId, stageId, categoryId)
            : await StatisticsService.getAgentStats(seasonId, stageId, categoryId);

        if (!result.success || !result.data) {
            return NextResponse.json({ error: 'Failed to fetch character stats' }, { status: 500 });
        }

        const chars = (result.data as any[]).slice(0, limit);
        const title = isMlbb ? 'MLBB HERO STATISTICS' : 'VALORANT AGENT STATISTICS';
        const charLabel = isMlbb ? 'HERO' : 'AGENT';

        let csv = '';

        // Row 1: Title
        csv += row(['', '', '', '', '', '', '', title, '', '', '', '', '', '', '']);

        // Row 2: Column headers
        if (isMlbb) {
            csv += row(['#', charLabel, 'GP', 'BANS', 'PICK%', 'BAN%', 'WR%', 'AVG K', 'AVG D', 'AVG A', 'KDA', 'AVG GOLD', 'AVG DMG', '', '']);
        } else {
            csv += row(['#', charLabel, 'ROLE', 'GP', 'WR%', 'AVG ACS', 'AVG K', 'AVG D', 'AVG A', 'KDA', 'AVG FB', '', '', '', '']);
        }

        // Row 3: Empty separator
        csv += emptyRow();

        // Rows 4+: Character data (capped)
        for (let i = 0; i < limit; i++) {
            const c = chars[i];
            if (!c) {
                if (isMlbb) {
                    csv += row([i + 1, N, N, N, N, N, N, N, N, N, N, N, N, '', '']);
                } else {
                    csv += row([i + 1, N, N, N, N, N, N, N, N, N, N, '', '', '', '']);
                }
                continue;
            }

            if (isMlbb) {
                csv += row([
                    i + 1,
                    c.hero_name || N,
                    c.games_played ?? 0,
                    c.total_bans ?? 0,
                    pct(c.pick_rate),
                    pct(c.ban_rate),
                    pct(c.win_rate),
                    fmt(c.avg_kills),
                    fmt(c.avg_deaths),
                    fmt(c.avg_assists),
                    fmt(c.avg_kda, 2),
                    fmt(c.avg_gold, 0),
                    fmt(c.avg_damage_dealt, 0),
                    '', '',
                ]);
            } else {
                csv += row([
                    i + 1,
                    c.agent_name || N,
                    c.agent_role || N,
                    c.games_played ?? 0,
                    pct(c.win_rate),
                    fmt(c.avg_acs),
                    fmt(c.avg_kills),
                    fmt(c.avg_deaths),
                    fmt(c.avg_assists),
                    fmt(c.avg_kda, 2),
                    fmt(c.avg_first_bloods),
                    '', '', '', '',
                ]);
            }
        }

        return new NextResponse(csv, {
            status: 200,
            headers: csvHeaders('character-stats'),
        });
    } catch (error) {
        console.error('Error generating character stats CSV:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

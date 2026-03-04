import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { StatisticsService } from '@/services/statistics';
import { row, emptyRow, fmt, pct, csvHeaders } from '@/lib/utils/csv-helpers';

const N = 'None';

/**
 * Export: Head-to-Head Team Comparison CSV — 15 columns (A–O)
 * Side-by-side layout (like game results) for two teams
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const teamA = searchParams.get('teamA');
        const teamB = searchParams.get('teamB');
        const game = (searchParams.get('game') || 'mlbb') as 'mlbb' | 'valorant';
        const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;
        const stageId = searchParams.get('stageId') ? parseInt(searchParams.get('stageId')!) : undefined;

        if (!teamA || !teamB) {
            return NextResponse.json({ error: 'Both teamA and teamB are required' }, { status: 400 });
        }

        const supabase = await getSupabaseServer();
        const isMlbb = game === 'mlbb';
        const title = isMlbb ? 'MLBB HEAD-TO-HEAD TEAMS' : 'VALORANT HEAD-TO-HEAD TEAMS';

        // Get team info
        const { data: teamsInfo } = await supabase
            .from('schools_teams')
            .select('id, name, schools(id, name, abbreviation, logo_url)')
            .in('id', [teamA, teamB]);

        const tA = (teamsInfo || []).find((t: any) => t.id === teamA);
        const tB = (teamsInfo || []).find((t: any) => t.id === teamB);
        const schoolA = Array.isArray(tA?.schools) ? tA.schools[0] : tA?.schools;
        const schoolB = Array.isArray(tB?.schools) ? tB.schools[0] : tB?.schools;
        const abbrA = schoolA?.abbreviation || N;
        const abbrB = schoolB?.abbreviation || N;
        const nameA = schoolA?.name || N;
        const nameB = schoolB?.name || N;

        // Direct H2H
        const { data: matchesA } = await supabase.from('match_participants').select('match_id').eq('team_id', teamA);
        const { data: matchesB } = await supabase.from('match_participants').select('match_id').eq('team_id', teamB);
        const matchIdsA = new Set((matchesA || []).map(m => m.match_id));
        const commonMatchIds = (matchesB || []).map(m => m.match_id).filter(id => matchIdsA.has(id));

        let h2hWinsA = 0, h2hWinsB = 0, h2hDraws = 0;
        if (commonMatchIds.length > 0) {
            const { data: matches } = await supabase
                .from('matches')
                .select('id, match_participants(team_id, match_score)')
                .in('id', commonMatchIds);

            for (const match of (matches || [])) {
                const parts = (match as any).match_participants || [];
                const scoreA = parts.find((p: any) => p.team_id === teamA)?.match_score || 0;
                const scoreB = parts.find((p: any) => p.team_id === teamB)?.match_score || 0;
                if (scoreA > scoreB) h2hWinsA++;
                else if (scoreB > scoreA) h2hWinsB++;
                else h2hDraws++;
            }
        }

        // Overall stats
        const teamStatsResult = await StatisticsService.getTeamStats(game, seasonId, stageId);
        const allTeams = teamStatsResult.success ? (teamStatsResult.data as any[]) : [];
        const statsA = allTeams.find((t: any) => t.team_id === teamA);
        const statsB = allTeams.find((t: any) => t.team_id === teamB);

        let csv = '';

        // Row 1: TEAM A ... TITLE ... TEAM B
        csv += row([abbrA, '', '', '', '', '', '', title, '', '', '', '', '', '', abbrB]);

        // Row 2: Schools
        csv += row([nameA, '', '', '', '', '', '', 'HEAD TO HEAD', '', '', '', '', '', '', nameB]);

        // Row 3: Empty
        csv += emptyRow();

        // Row 4: H2H record
        csv += row([h2hWinsA, '', '', '', '', '', '', 'MATCH RECORD', '', '', '', '', '', '', h2hWinsB]);

        // Row 5: Empty
        csv += emptyRow();

        // Row 6: Overall stats header
        csv += row(['', '', '', '', '', '', '', 'OVERALL STATS', '', '', '', '', '', '', '']);

        // Helper: stat row
        const statRow = (label: string, valA: any, valB: any) =>
            row([valA ?? N, '', '', '', '', '', '', label, '', '', '', '', '', '', valB ?? N]);

        csv += statRow('GAMES PLAYED', statsA?.games_played, statsB?.games_played);
        csv += statRow('WINS', statsA?.total_wins, statsB?.total_wins);
        csv += statRow('LOSSES', statsA?.total_losses, statsB?.total_losses);
        csv += statRow('WIN RATE', statsA ? pct(statsA.win_rate) : N, statsB ? pct(statsB.win_rate) : N);
        csv += statRow('TOTAL KILLS', statsA?.total_kills, statsB?.total_kills);
        csv += statRow('TOTAL DEATHS', statsA?.total_deaths, statsB?.total_deaths);
        csv += statRow('TOTAL ASSISTS', statsA?.total_assists, statsB?.total_assists);

        const kdaA = statsA && statsA.total_deaths > 0
            ? ((statsA.total_kills + statsA.total_assists) / statsA.total_deaths).toFixed(2)
            : statsA ? (statsA.total_kills + statsA.total_assists).toFixed(2) : N;
        const kdaB = statsB && statsB.total_deaths > 0
            ? ((statsB.total_kills + statsB.total_assists) / statsB.total_deaths).toFixed(2)
            : statsB ? (statsB.total_kills + statsB.total_assists).toFixed(2) : N;

        csv += statRow('KDA', kdaA, kdaB);

        if (isMlbb) {
            csv += statRow('AVG GOLD/GAME', statsA ? fmt(statsA.avg_gold_per_game, 0) : N, statsB ? fmt(statsB.avg_gold_per_game, 0) : N);
            csv += statRow('AVG DMG/GAME', statsA ? fmt(statsA.avg_damage_per_game, 0) : N, statsB ? fmt(statsB.avg_damage_per_game, 0) : N);
        } else {
            csv += statRow('AVG ACS', statsA ? fmt(statsA.avg_acs) : N, statsB ? fmt(statsB.avg_acs) : N);
            csv += statRow('FIRST BLOODS', statsA?.total_first_bloods ?? N, statsB?.total_first_bloods ?? N);
        }

        return new NextResponse(csv, {
            status: 200,
            headers: csvHeaders('h2h-teams'),
        });
    } catch (error) {
        console.error('Error generating H2H teams CSV:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

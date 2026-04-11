import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getExportCacheVersion } from '@/lib/utils/export-cache';

// ── CSV helpers ──
const escapeCsv = (v: any): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
};
const row = (vals: (string | number | null | undefined)[]): string =>
    vals.map(escapeCsv).join(',') + '\r\n';

const N = 'None';

/**
 * Progress bar value: A / (A + B) * 100, rounded to integer (no % symbol).
 * If both are 0, returns 50 (even split).
 */
function progBar(a: number, b: number): number {
    const total = a + b;
    if (total === 0) return 50;
    return Math.round((a / total) * 100);
}

/** Local file path for school logo */
function schoolLogoPath(abbrev: string): string {
    return `C:\\Users\\CESAFI\\Desktop\\CEL S4\\IMAGES\\SCHOOL_LOGOS\\${abbrev.toUpperCase()}.png`;
}

/** Local file path for player photo */
function playerPhotoPath(schoolAbbr: string, esportAbbrev: string, ign: string): string {
    return `C:\\Users\\CESAFI\\Desktop\\CEL S4\\IMAGES\\Players\\${schoolAbbr}\\${esportAbbrev}\\${ign}_Formal.png`;
}

// Event-driven in-memory cache for H2H Teams
let h2hTeamsCache: {
    key: string;
    response: { text: string; status: number; headers: Record<string, string> };
    version: number;
} | null = null;

/**
 * Team Head-to-Head CSV — production matrix for vMix broadcast overlay.
 *
 * Layout: 7 columns (A–G)
 *   A = Label | B = Team A Value | C = Team A Bar% | D = spacer | E = Team B Bar% | F = Team B Value | G = Label (right)
 */
export async function GET(request: NextRequest) {
    try {
        const params = await getActiveParams(request, 'h2h-teams');
        const game = (params.game || 'mlbb') as 'mlbb' | 'valorant';
        const teamAId = (params.teamAId as string) || (params.teamA as string);
        const teamBId = (params.teamBId as string) || (params.teamB as string);
        const format = getProductionFormat(request);
        const cacheKey = `${game}:${teamAId}:${teamBId}:${format}`;

        // Serve from cache if version matches
        if (h2hTeamsCache && h2hTeamsCache.key === cacheKey && h2hTeamsCache.version === getExportCacheVersion('h2h')) {
            return new NextResponse(h2hTeamsCache.response.text, {
                status: h2hTeamsCache.response.status,
                headers: h2hTeamsCache.response.headers
            });
        }

        const filters = {
            season_id: params.seasonId ? parseInt(params.seasonId as string) : undefined,
            stage_id: params.stageId ? parseInt(params.stageId as string) : undefined,
        };

        if (!teamAId || !teamBId) {
            return NextResponse.json({ success: false, error: 'Both teamA and teamB are required' }, { status: 400 });
        }

        // ── 1. Fetch team stats (RPC handles aggregation & unique chars) ──
        const result = await StatisticsService.getTeamH2H(game, teamAId, teamBId, filters);

        if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });

        const teamA = (result.data as any)?.teamA;
        const teamB = (result.data as any)?.teamB;

        if (!teamA || !teamB) {
            return NextResponse.json({ success: false, error: 'One or both teams not found in stats' }, { status: 404 });
        }

        // If format is not CSV, return raw JSON with bar values added
        if (format !== 'csv') {
            const isValorant = game === 'valorant';
            const statRows = isValorant
                ? buildValorantStats(teamA, teamB)
                : buildMlbbStats(teamA, teamB);

            return vmixResponse({
                teamA: {
                    ...teamA,
                    logo_path: schoolLogoPath(teamA.school_abbreviation || 'UNKNOWN'),
                },
                teamB: {
                    ...teamB,
                    logo_path: schoolLogoPath(teamB.school_abbreviation || 'UNKNOWN'),
                },
                stats: statRows,
            }, format, 'h2h_teams', {}, 600);
        }

        // ── 2. Fetch rosters for both teams ──
        const supabase = await getSupabaseServer();

        const [rosterARes, rosterBRes] = await Promise.all([
            supabase.from('game_roster' as any).select('player_role, sort_order, player:players(ign)').eq('team_id', teamAId).order('sort_order', { ascending: true }).limit(5),
            supabase.from('game_roster' as any).select('player_role, sort_order, player:players(ign)').eq('team_id', teamBId).order('sort_order', { ascending: true }).limit(5),
        ]);

        // Use a simpler roster fetch from the team's players
        const [playersARes, playersBRes] = await Promise.all([
            supabase.from('team_players' as any).select('player_role, sort_order, player:players(ign)').eq('team_id', teamAId).eq('is_active', true).order('sort_order', { ascending: true }),
            supabase.from('team_players' as any).select('player_role, sort_order, player:players(ign)').eq('team_id', teamBId).eq('is_active', true).order('sort_order', { ascending: true }),
        ]);

        const rosterA = (playersARes.data || rosterARes.data || []) as any[];
        const rosterB = (playersBRes.data || rosterBRes.data || []) as any[];

        const pad5 = <T,>(arr: T[], fill: T): T[] => {
            const r = arr.slice(0, 5);
            while (r.length < 5) r.push(fill);
            return r;
        };

        const aIgns = pad5(rosterA.map((r: any) => (Array.isArray(r.player) ? r.player[0]?.ign : r.player?.ign) || N), N);
        const bIgns = pad5(rosterB.map((r: any) => (Array.isArray(r.player) ? r.player[0]?.ign : r.player?.ign) || N), N);
        const aRoles = pad5(rosterA.map((r: any) => r.player_role || N), N);
        const bRoles = pad5(rosterB.map((r: any) => r.player_role || N), N);

        const abbrA = teamA.school_abbreviation || 'UNK';
        const abbrB = teamB.school_abbreviation || 'UNK';
        const isValorant = game === 'valorant';
        const esportAbbrev = isValorant ? 'VALORANT' : 'MLBB';

        const aPlayerPaths = pad5(aIgns.map(ign => playerPhotoPath(abbrA, esportAbbrev, ign)), N);
        const bPlayerPaths = pad5(bIgns.map(ign => playerPhotoPath(abbrB, esportAbbrev, ign)), N);

        // ── 3. Build stat comparison rows ──
        const statRows = isValorant
            ? buildValorantStats(teamA, teamB)
            : buildMlbbStats(teamA, teamB);

        // ═══════════════════════════════════════════
        //  BUILD CSV — 13 columns (A–M)
        //  Matches the vMix Team Head-to-Head overlay
        // ═══════════════════════════════════════════
        let csv = '';

        // Row 1: Header
        csv += row(['TEAM A', '', '', '', '', 'TEAM HEAD TO HEAD', '', '', '', '', '', '', 'TEAM B']);

        // Row 2: School abbreviations + logos
        csv += row([abbrA, '', '', '', '', '', isValorant ? 'VALORANT' : 'MLBB', '', '', '', '', '', abbrB]);

        // Row 3: School names
        csv += row([teamA.school_name || N, '', '', '', '', '', '', '', '', '', '', '', teamB.school_name || N]);

        // Row 4: Team names
        csv += row([teamA.team_name || N, '', '', '', '', '', '', '', '', '', '', '', teamB.team_name || N]);

        // Row 5: Logo paths
        csv += row([schoolLogoPath(abbrA), '', '', '', '', '', '', '', '', '', '', '', schoolLogoPath(abbrB)]);

        // Row 6: empty spacer
        csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '']);

        // Row 7: Player photo paths (5 per side)
        csv += row(['PHOTOS', ...aPlayerPaths, '', ...bPlayerPaths.reverse(), 'PHOTOS']);

        // Row 8: Player IGNs
        csv += row(['PLAYERS', ...aIgns, '', ...bIgns.reverse(), 'PLAYERS']);

        // Row 9: Player roles
        csv += row(['ROLES', ...aRoles, '', ...bRoles.reverse(), 'ROLES']);

        // Row 10: empty spacer
        csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '']);

        // Rows 11+: Stat comparison rows
        // Layout: LABEL | A_VALUE | A_BAR% | spacer | B_BAR% | B_VALUE | RIGHT_LABEL
        csv += row(['STAT', 'A_VALUE', 'A_BAR', '', 'B_BAR', 'B_VALUE', 'STAT']);

        for (const stat of statRows) {
            csv += row([stat.label, stat.aValue, stat.aBar, '', stat.bBar, stat.bValue, stat.label]);
        }

        // Row: empty spacer
        csv += row(['', '', '', '', '', '', '']);

        // ── Return CSV ──
        const csvResponse = new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="h2h-teams-${abbrA}-vs-${abbrB}.csv"`,
                'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120',
            },
        });

        // Store in cache
        h2hTeamsCache = {
            key: cacheKey,
            response: {
                text: csv,
                status: 200,
                headers: Object.fromEntries(csvResponse.headers.entries())
            },
            version: getExportCacheVersion('h2h')
        };

        return csvResponse;

    } catch (error: any) {
        console.error('Error in team h2h API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// ── Stat row builders ──

interface StatRow {
    label: string;
    aValue: string | number;
    bValue: string | number;
    aBar: number; // 0–100 progress bar percentage
    bBar: number; // 0–100 progress bar percentage
}

function buildMlbbStats(a: any, b: any): StatRow[] {
    const gA = a.games_played || 1;
    const gB = b.games_played || 1;

    // KDA = (K+A)/D
    const kdaA = (a.total_deaths || 0) > 0 ? ((a.total_kills || 0) + (a.total_assists || 0)) / (a.total_deaths || 1) : (a.total_kills || 0) + (a.total_assists || 0);
    const kdaB = (b.total_deaths || 0) > 0 ? ((b.total_kills || 0) + (b.total_assists || 0)) / (b.total_deaths || 1) : (b.total_kills || 0) + (b.total_assists || 0);

    // Use RPC calculated averages
    const gpmA = Math.round(a.avg_gold_per_game || 0);
    const gpmB = Math.round(b.avg_gold_per_game || 0);
    const dpmA = Math.round(a.avg_damage_per_game || 0);
    const dpmB = Math.round(b.avg_damage_per_game || 0);

    return [
        { label: 'KDA', aValue: kdaA.toFixed(2), bValue: kdaB.toFixed(2), aBar: progBar(kdaA, kdaB), bBar: progBar(kdaB, kdaA) },
        { label: 'AVG KILLS', aValue: (a.avg_kills_per_game || 0).toFixed(1), bValue: (b.avg_kills_per_game || 0).toFixed(1), aBar: progBar(a.avg_kills_per_game || 0, b.avg_kills_per_game || 0), bBar: progBar(b.avg_kills_per_game || 0, a.avg_kills_per_game || 0) },
        { label: 'AVG DEATHS', aValue: (a.avg_deaths_per_game || 0).toFixed(1), bValue: (b.avg_deaths_per_game || 0).toFixed(1), aBar: progBar(b.avg_deaths_per_game || 0, a.avg_deaths_per_game || 0), bBar: progBar(a.avg_deaths_per_game || 0, b.avg_deaths_per_game || 0) },
        { label: 'AVG ASSISTS', aValue: (a.avg_assists_per_game || 0).toFixed(1), bValue: (b.avg_assists_per_game || 0).toFixed(1), aBar: progBar(a.avg_assists_per_game || 0, b.avg_assists_per_game || 0), bBar: progBar(b.avg_assists_per_game || 0, a.avg_assists_per_game || 0) },
        { label: 'TOTAL KILLS', aValue: a.total_kills || 0, bValue: b.total_kills || 0, aBar: progBar(a.total_kills || 0, b.total_kills || 0), bBar: progBar(b.total_kills || 0, a.total_kills || 0) },
        { label: 'TOTAL DEATHS', aValue: a.total_deaths || 0, bValue: b.total_deaths || 0, aBar: progBar(b.total_deaths || 0, a.total_deaths || 0), bBar: progBar(a.total_deaths || 0, b.total_deaths || 0) },
        { label: 'TOTAL ASSISTS', aValue: a.total_assists || 0, bValue: b.total_assists || 0, aBar: progBar(a.total_assists || 0, b.total_assists || 0), bBar: progBar(b.total_assists || 0, a.total_assists || 0) },
        { label: 'TEAM GPM', aValue: gpmA, bValue: gpmB, aBar: progBar(gpmA, gpmB), bBar: progBar(gpmB, gpmA) },
        { label: 'TEAM DPM', aValue: dpmA, bValue: dpmB, aBar: progBar(dpmA, dpmB), bBar: progBar(dpmB, dpmA) },
        { label: 'DMG TAKEN/G', aValue: Math.round((a.total_damage_taken || 0) / gA), bValue: Math.round((b.total_damage_taken || 0) / gB), aBar: progBar((a.total_damage_taken || 0) / gA, (b.total_damage_taken || 0) / gB), bBar: progBar((b.total_damage_taken || 0) / gB, (a.total_damage_taken || 0) / gA) },
        { label: 'RATING', aValue: (a.avg_rating || 0).toFixed(2), bValue: (b.avg_rating || 0).toFixed(2), aBar: progBar(a.avg_rating || 0, b.avg_rating || 0), bBar: progBar(b.avg_rating || 0, a.avg_rating || 0) },
        { label: 'TEAMFIGHT %', aValue: `${Math.round(a.avg_teamfight_percent || 0)}%`, bValue: `${Math.round(b.avg_teamfight_percent || 0)}%`, aBar: progBar(a.avg_teamfight_percent || 0, b.avg_teamfight_percent || 0), bBar: progBar(b.avg_teamfight_percent || 0, a.avg_teamfight_percent || 0) },
        { label: 'TURTLES', aValue: a.total_turtle_slain || 0, bValue: b.total_turtle_slain || 0, aBar: progBar(a.total_turtle_slain || 0, b.total_turtle_slain || 0), bBar: progBar(b.total_turtle_slain || 0, a.total_turtle_slain || 0) },
        { label: 'LORDS', aValue: a.total_lord_slain || 0, bValue: b.total_lord_slain || 0, aBar: progBar(a.total_lord_slain || 0, b.total_lord_slain || 0), bBar: progBar(b.total_lord_slain || 0, a.total_lord_slain || 0) },
        { label: 'TURRET DMG/G', aValue: Math.round((a.total_turret_damage || 0) / gA), bValue: Math.round((b.total_turret_damage || 0) / gB), aBar: progBar((a.total_turret_damage || 0) / gA, (b.total_turret_damage || 0) / gB), bBar: progBar((b.total_turret_damage || 0) / gB, (a.total_turret_damage || 0) / gA) },
        { label: 'HERO POOL', aValue: a.unique_chars || 0, bValue: b.unique_chars || 0, aBar: progBar(a.unique_chars || 0, b.unique_chars || 0), bBar: progBar(b.unique_chars || 0, a.unique_chars || 0) },
        { label: 'WIN RATE', aValue: `${Math.round(a.win_rate || 0)}%`, bValue: `${Math.round(b.win_rate || 0)}%`, aBar: progBar(a.win_rate || 0, b.win_rate || 0), bBar: progBar(b.win_rate || 0, a.win_rate || 0) },
        { label: 'GAMES PLAYED', aValue: a.games_played || 0, bValue: b.games_played || 0, aBar: progBar(a.games_played || 0, b.games_played || 0), bBar: progBar(b.games_played || 0, a.games_played || 0) },
        { label: 'TOTAL WINS', aValue: a.total_wins || 0, bValue: b.total_wins || 0, aBar: progBar(a.total_wins || 0, b.total_wins || 0), bBar: progBar(b.total_wins || 0, a.total_wins || 0) },
    ];
}

function buildValorantStats(a: any, b: any): StatRow[] {
    const kdaA = (a.total_deaths || 0) > 0 ? ((a.total_kills || 0) + (a.total_assists || 0)) / (a.total_deaths || 1) : (a.total_kills || 0) + (a.total_assists || 0);
    const kdaB = (b.total_deaths || 0) > 0 ? ((b.total_kills || 0) + (b.total_assists || 0)) / (b.total_deaths || 1) : (b.total_kills || 0) + (b.total_assists || 0);

    return [
        { label: 'AVG ACS', aValue: (a.avg_acs || 0).toFixed(1), bValue: (b.avg_acs || 0).toFixed(1), aBar: progBar(a.avg_acs || 0, b.avg_acs || 0), bBar: progBar(b.avg_acs || 0, a.avg_acs || 0) },
        { label: 'KDA', aValue: kdaA.toFixed(2), bValue: kdaB.toFixed(2), aBar: progBar(kdaA, kdaB), bBar: progBar(kdaB, kdaA) },
        { label: 'AVG KILLS', aValue: (a.avg_kills_per_game || 0).toFixed(1), bValue: (b.avg_kills_per_game || 0).toFixed(1), aBar: progBar(a.avg_kills_per_game || 0, b.avg_kills_per_game || 0), bBar: progBar(b.avg_kills_per_game || 0, a.avg_kills_per_game || 0) },
        { label: 'AVG DEATHS', aValue: (a.avg_deaths_per_game || 0).toFixed(1), bValue: (b.avg_deaths_per_game || 0).toFixed(1), aBar: progBar(a.avg_deaths_per_game || 0, b.avg_deaths_per_game || 0), bBar: progBar(b.avg_deaths_per_game || 0, a.avg_deaths_per_game || 0) },
        { label: 'AVG ASSISTS', aValue: (a.avg_assists_per_game || 0).toFixed(1), bValue: (b.avg_assists_per_game || 0).toFixed(1), aBar: progBar(a.avg_assists_per_game || 0, b.avg_assists_per_game || 0), bBar: progBar(b.avg_assists_per_game || 0, a.avg_assists_per_game || 0) },
        { label: 'TOTAL KILLS', aValue: a.total_kills || 0, bValue: b.total_kills || 0, aBar: progBar(a.total_kills || 0, b.total_kills || 0), bBar: progBar(b.total_kills || 0, a.total_kills || 0) },
        { label: 'TOTAL DEATHS', aValue: a.total_deaths || 0, bValue: b.total_deaths || 0, aBar: progBar(a.total_deaths || 0, b.total_deaths || 0), bBar: progBar(b.total_deaths || 0, a.total_deaths || 0) },
        { label: 'TOTAL ASSISTS', aValue: a.total_assists || 0, bValue: b.total_assists || 0, aBar: progBar(a.total_assists || 0, b.total_assists || 0), bBar: progBar(b.total_assists || 0, a.total_assists || 0) },
        { label: 'AGENT POOL', aValue: a.unique_chars || 0, bValue: b.unique_chars || 0, aBar: progBar(a.unique_chars || 0, b.unique_chars || 0), bBar: progBar(b.unique_chars || 0, a.unique_chars || 0) },
        { label: 'FIRST BLOODS', aValue: a.total_first_bloods || 0, bValue: b.total_first_bloods || 0, aBar: progBar(a.total_first_bloods || 0, b.total_first_bloods || 0), bBar: progBar(b.total_first_bloods || 0, a.total_first_bloods || 0) },
        { label: 'PLANTS', aValue: a.total_plants || 0, bValue: b.total_plants || 0, aBar: progBar(a.total_plants || 0, b.total_plants || 0), bBar: progBar(b.total_plants || 0, a.total_plants || 0) },
        { label: 'DEFUSES', aValue: a.total_defuses || 0, bValue: b.total_defuses || 0, aBar: progBar(a.total_defuses || 0, b.total_defuses || 0), bBar: progBar(b.total_defuses || 0, a.total_defuses || 0) },
        { label: 'ECON RATING', aValue: (a.avg_econ_rating || 0).toFixed(1), bValue: (b.avg_econ_rating || 0).toFixed(1), aBar: progBar(a.avg_econ_rating || 0, b.avg_econ_rating || 0), bBar: progBar(b.avg_econ_rating || 0, a.avg_econ_rating || 0) },
        { label: 'WIN RATE', aValue: `${Math.round(a.win_rate || 0)}%`, bValue: `${Math.round(b.win_rate || 0)}%`, aBar: progBar(a.win_rate || 0, b.win_rate || 0), bBar: progBar(b.win_rate || 0, a.win_rate || 0) },
        { label: 'GAMES PLAYED', aValue: a.games_played || 0, bValue: b.games_played || 0, aBar: progBar(a.games_played || 0, b.games_played || 0), bBar: progBar(b.games_played || 0, a.games_played || 0) },
        { label: 'ROUNDS PLAYED', aValue: a.total_rounds_played || 0, bValue: b.total_rounds_played || 0, aBar: progBar(a.total_rounds_played || 0, b.total_rounds_played || 0), bBar: progBar(b.total_rounds_played || 0, a.total_rounds_played || 0) },
        { label: 'TOTAL WINS', aValue: a.total_wins || 0, bValue: b.total_wins || 0, aBar: progBar(a.total_wins || 0, b.total_wins || 0), bBar: progBar(b.total_wins || 0, a.total_wins || 0) },
    ];
}

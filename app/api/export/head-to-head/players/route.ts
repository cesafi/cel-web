import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/services/statistics';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';
import { vmixResponse } from '@/lib/utils/vmix-format';
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

/** Local file path for player photo */
function playerPhotoPath(schoolAbbr: string, esportAbbrev: string, ign: string): string {
    return `C:\\Users\\CESAFI\\Desktop\\CEL S4\\IMAGES\\Players\\${schoolAbbr}\\${esportAbbrev}\\${ign}_Formal.png`;
}

/** Local file path for school logo */
function schoolLogoPath(abbrev: string): string {
    return `C:\\Users\\CESAFI\\Desktop\\CEL S4\\IMAGES\\SCHOOL_LOGOS\\${abbrev.toUpperCase()}.png`;
}

// Event-driven in-memory cache for H2H Players
let h2hPlayersCache: {
    key: string;
    response: { text: string; status: number; headers: Record<string, string> };
    version: number;
} | null = null;

/**
 * Player Head-to-Head CSV — production matrix for vMix broadcast overlay.
 *
 * Layout: 7 columns
 *   A = Label | B = Player A Value | C = A Bar% | D = spacer | E = B Bar% | F = Player B Value | G = Label
 */
export async function GET(request: NextRequest) {
    try {
        const params = await getActiveParams(request, 'h2h-players');
        const game = (params.game || 'mlbb') as 'mlbb' | 'valorant';
        const playerAId = (params.playerAId as string) || (params.playerA as string);
        const playerBId = (params.playerBId as string) || (params.playerB as string);
        const format = getProductionFormat(request);
        const cacheKey = `${game}:${playerAId}:${playerBId}:${format}`;

        // Serve from cache if version matches
        if (h2hPlayersCache && h2hPlayersCache.key === cacheKey && h2hPlayersCache.version === getExportCacheVersion('h2h')) {
            return new NextResponse(h2hPlayersCache.response.text, {
                status: h2hPlayersCache.response.status,
                headers: h2hPlayersCache.response.headers
            });
        }

        const filters = {
            season_id: params.seasonId ? parseInt(params.seasonId as string) : undefined,
            stage_id: params.stageId ? parseInt(params.stageId as string) : undefined,
        };

        if (!playerAId || !playerBId) {
            return NextResponse.json({ success: false, error: 'Both playerA and playerB are required' }, { status: 400 });
        }

        // ── 1. Fetch player stats ──
        const result = await StatisticsService.getPlayerH2H(game, playerAId, playerBId, filters);
        if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });

        const playerA = (result.data as any)?.playerA;
        const playerB = (result.data as any)?.playerB;

        if (!playerA || !playerB) {
            return NextResponse.json({ success: false, error: 'One or both players not found' }, { status: 404 });
        }

        const isValorant = game === 'valorant';
        const esportAbbrev = isValorant ? 'VALORANT' : 'MLBB';

        // Build stat rows
        const statRows = isValorant
            ? buildValorantPlayerStats(playerA, playerB)
            : buildMlbbPlayerStats(playerA, playerB);

        // If format is not CSV, return raw JSON with bar values
        if (format !== 'csv') {
            return vmixResponse({
                playerA: {
                    ...playerA,
                    photo_path: playerPhotoPath(playerA.team_name || 'UNKNOWN', esportAbbrev, playerA.player_ign || 'UNKNOWN'),
                },
                playerB: {
                    ...playerB,
                    photo_path: playerPhotoPath(playerB.team_name || 'UNKNOWN', esportAbbrev, playerB.player_ign || 'UNKNOWN'),
                },
                stats: statRows,
            }, format, 'h2h_players', {}, 600);
        }

        // ── 2. Derive metadata ──
        // Get school abbreviation from team_name (stored in MV) — we need a lookup
        // The MV has team_name and team_logo_url but not school_abbreviation for player stats
        // We'll use what we have
        const aIgn = playerA.player_ign || N;
        const bIgn = playerB.player_ign || N;
        const aTeam = playerA.school_abbreviation || N;
        const bTeam = playerB.school_abbreviation || N;

        // Attempt to derive school abbreviation from team_logo_url or team_name
        // For now we'll use team_name as the best proxy
        const aAbbr = (playerA as any).school_abbreviation || aTeam;
        const bAbbr = (playerB as any).school_abbreviation || bTeam;

        // ═══════════════════════════════════════════
        //  BUILD CSV — 7-column grid
        // ═══════════════════════════════════════════
        let csv = '';

        // Row 1: Header
        csv += row(['PLAYER A', '', '', 'PLAYER HEAD TO HEAD', '', '', 'PLAYER B']);

        // Row 2: School abbreviations
        csv += row([aAbbr, '', '', isValorant ? 'VALORANT' : 'MLBB', '', '', bAbbr]);

        // Row 3: School logo paths
        csv += row([schoolLogoPath(aAbbr), '', '', '', '', '', schoolLogoPath(bAbbr)]);

        // Row 4: Player photo paths
        csv += row([playerPhotoPath(aAbbr, esportAbbrev, aIgn), '', '', '', '', '', playerPhotoPath(bAbbr, esportAbbrev, bIgn)]);

        // Row 5: Player IGNs
        csv += row([aIgn, '', '', 'vs', '', '', bIgn]);

        // Row 6: Team names
        csv += row([aTeam, '', '', '', '', '', bTeam]);

        // Row 7: empty spacer
        csv += row(['', '', '', '', '', '', '']);

        // Row 8: Stat header
        csv += row(['STAT', 'A_VALUE', 'A_BAR', '', 'B_BAR', 'B_VALUE', 'STAT']);

        // Stat comparison rows
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
                'Content-Disposition': `attachment; filename="h2h-players-${aIgn}-vs-${bIgn}.csv"`,
                'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120',
            },
        });

        // Store in cache
        h2hPlayersCache = {
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
        console.error('Error in player h2h API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// ── Stat row builders ──

interface StatRow {
    label: string;
    aValue: string | number;
    bValue: string | number;
    aBar: number;
    bBar: number;
}

function buildMlbbPlayerStats(a: any, b: any): StatRow[] {
    const kdaA = (a.total_deaths || 0) > 0 ? ((a.total_kills || 0) + (a.total_assists || 0)) / (a.total_deaths || 1) : (a.total_kills || 0) + (a.total_assists || 0);
    const kdaB = (b.total_deaths || 0) > 0 ? ((b.total_kills || 0) + (b.total_assists || 0)) / (b.total_deaths || 1) : (b.total_kills || 0) + (b.total_assists || 0);

    const gpmA = a.avg_gpm || 0;
    const gpmB = b.avg_gpm || 0;

    const ratingA = a.avg_rating || 0;
    const ratingB = b.avg_rating || 0;

    const tfA = a.avg_teamfight_percent || 0;
    const tfB = b.avg_teamfight_percent || 0;

    const killsA = a.avg_kills || 0;
    const killsB = b.avg_kills || 0;
    const deathsA = a.avg_deaths || 0;
    const deathsB = b.avg_deaths || 0;
    const assistsA = a.avg_assists || 0;
    const assistsB = b.avg_assists || 0;

    return [
        { label: 'KDA', aValue: kdaA.toFixed(2), bValue: kdaB.toFixed(2), aBar: progBar(kdaA, kdaB), bBar: progBar(kdaB, kdaA) },
        { label: 'AVG KILLS', aValue: killsA.toFixed(1), bValue: killsB.toFixed(1), aBar: progBar(killsA, killsB), bBar: progBar(killsB, killsA) },
        { label: 'AVG DEATHS', aValue: deathsA.toFixed(1), bValue: deathsB.toFixed(1), aBar: progBar(deathsB, deathsA), bBar: progBar(deathsA, deathsB) },
        { label: 'AVG ASSISTS', aValue: assistsA.toFixed(1), bValue: assistsB.toFixed(1), aBar: progBar(assistsA, assistsB), bBar: progBar(assistsB, assistsA) },
        { label: 'TOTAL KILLS', aValue: a.total_kills || 0, bValue: b.total_kills || 0, aBar: progBar(a.total_kills || 0, b.total_kills || 0), bBar: progBar(b.total_kills || 0, a.total_kills || 0) },
        { label: 'TOTAL DEATHS', aValue: a.total_deaths || 0, bValue: b.total_deaths || 0, aBar: progBar(b.total_deaths || 0, a.total_deaths || 0), bBar: progBar(a.total_deaths || 0, b.total_deaths || 0) },
        { label: 'TOTAL ASSISTS', aValue: a.total_assists || 0, bValue: b.total_assists || 0, aBar: progBar(a.total_assists || 0, b.total_assists || 0), bBar: progBar(b.total_assists || 0, a.total_assists || 0) },
        { label: 'AVG GPM', aValue: Math.round(gpmA), bValue: Math.round(gpmB), aBar: progBar(gpmA, gpmB), bBar: progBar(gpmB, gpmA) },
        { label: 'RATING', aValue: ratingA.toFixed(2), bValue: ratingB.toFixed(2), aBar: progBar(ratingA, ratingB), bBar: progBar(ratingB, ratingA) },
        { label: 'TEAMFIGHT %', aValue: `${Math.round(tfA)}%`, bValue: `${Math.round(tfB)}%`, aBar: progBar(tfA, tfB), bBar: progBar(tfB, tfA) },
        { label: 'DMG DEALT', aValue: Math.round(a.total_damage_dealt || 0), bValue: Math.round(b.total_damage_dealt || 0), aBar: progBar(a.total_damage_dealt || 0, b.total_damage_dealt || 0), bBar: progBar(b.total_damage_dealt || 0, a.total_damage_dealt || 0) },
        { label: 'DMG TAKEN', aValue: Math.round(a.total_damage_taken || 0), bValue: Math.round(b.total_damage_taken || 0), aBar: progBar(b.total_damage_taken || 0, a.total_damage_taken || 0), bBar: progBar(a.total_damage_taken || 0, b.total_damage_taken || 0) },
        { label: 'TURRET DMG', aValue: Math.round(a.total_turret_damage || 0), bValue: Math.round(b.total_turret_damage || 0), aBar: progBar(a.total_turret_damage || 0, b.total_turret_damage || 0), bBar: progBar(b.total_turret_damage || 0, a.total_turret_damage || 0) },
        { label: 'HERO POOL', aValue: a.unique_chars || 0, bValue: b.unique_chars || 0, aBar: progBar(a.unique_chars || 0, b.unique_chars || 0), bBar: progBar(b.unique_chars || 0, a.unique_chars || 0) },
        { label: 'WIN RATE', aValue: `${Math.round(a.win_rate || 0)}%`, bValue: `${Math.round(b.win_rate || 0)}%`, aBar: progBar(a.win_rate || 0, b.win_rate || 0), bBar: progBar(b.win_rate || 0, a.win_rate || 0) },
        { label: 'MVP', aValue: a.mvp_count || 0, bValue: b.mvp_count || 0, aBar: progBar(a.mvp_count || 0, b.mvp_count || 0), bBar: progBar(b.mvp_count || 0, a.mvp_count || 0) },
        { label: 'GAMES PLAYED', aValue: a.games_played || 0, bValue: b.games_played || 0, aBar: progBar(a.games_played || 0, b.games_played || 0), bBar: progBar(b.games_played || 0, a.games_played || 0) },
        { label: 'TOTAL WINS', aValue: a.wins || 0, bValue: b.wins || 0, aBar: progBar(a.wins || 0, b.wins || 0), bBar: progBar(b.wins || 0, a.wins || 0) },
    ];
}

function buildValorantPlayerStats(a: any, b: any): StatRow[] {
    const kdaA = (a.total_deaths || 0) > 0 ? ((a.total_kills || 0) + (a.total_assists || 0)) / (a.total_deaths || 1) : (a.total_kills || 0) + (a.total_assists || 0);
    const kdaB = (b.total_deaths || 0) > 0 ? ((b.total_kills || 0) + (b.total_assists || 0)) / (b.total_deaths || 1) : (b.total_kills || 0) + (b.total_assists || 0);

    return [
        { label: 'AVG ACS', aValue: (a.avg_acs || 0).toFixed(1), bValue: (b.avg_acs || 0).toFixed(1), aBar: progBar(a.avg_acs || 0, b.avg_acs || 0), bBar: progBar(b.avg_acs || 0, a.avg_acs || 0) },
        { label: 'KDA', aValue: kdaA.toFixed(2), bValue: kdaB.toFixed(2), aBar: progBar(kdaA, kdaB), bBar: progBar(kdaB, kdaA) },
        { label: 'AVG KILLS', aValue: (a.avg_kills || 0).toFixed(1), bValue: (b.avg_kills || 0).toFixed(1), aBar: progBar(a.avg_kills || 0, b.avg_kills || 0), bBar: progBar(b.avg_kills || 0, a.avg_kills || 0) },
        { label: 'AVG DEATHS', aValue: (a.avg_deaths || 0).toFixed(1), bValue: (b.avg_deaths || 0).toFixed(1), aBar: progBar(b.avg_deaths || 0, a.avg_deaths || 0), bBar: progBar(a.avg_deaths || 0, b.avg_deaths || 0) },
        { label: 'AVG ASSISTS', aValue: (a.avg_assists || 0).toFixed(1), bValue: (b.avg_assists || 0).toFixed(1), aBar: progBar(a.avg_assists || 0, b.avg_assists || 0), bBar: progBar(b.avg_assists || 0, a.avg_assists || 0) },
        { label: 'TOTAL KILLS', aValue: a.total_kills || 0, bValue: b.total_kills || 0, aBar: progBar(a.total_kills || 0, b.total_kills || 0), bBar: progBar(b.total_kills || 0, a.total_kills || 0) },
        { label: 'TOTAL DEATHS', aValue: a.total_deaths || 0, bValue: b.total_deaths || 0, aBar: progBar(b.total_deaths || 0, a.total_deaths || 0), bBar: progBar(a.total_deaths || 0, b.total_deaths || 0) },
        { label: 'TOTAL ASSISTS', aValue: a.total_assists || 0, bValue: b.total_assists || 0, aBar: progBar(a.total_assists || 0, b.total_assists || 0), bBar: progBar(b.total_assists || 0, a.total_assists || 0) },
        { label: 'AGENT POOL', aValue: a.unique_chars || 0, bValue: b.unique_chars || 0, aBar: progBar(a.unique_chars || 0, b.unique_chars || 0), bBar: progBar(b.unique_chars || 0, a.unique_chars || 0) },
        { label: 'FIRST BLOODS', aValue: a.total_first_bloods || 0, bValue: b.total_first_bloods || 0, aBar: progBar(a.total_first_bloods || 0, b.total_first_bloods || 0), bBar: progBar(b.total_first_bloods || 0, a.total_first_bloods || 0) },
        { label: 'PLANTS', aValue: a.total_plants || 0, bValue: b.total_plants || 0, aBar: progBar(a.total_plants || 0, b.total_plants || 0), bBar: progBar(b.total_plants || 0, a.total_plants || 0) },
        { label: 'DEFUSES', aValue: a.total_defuses || 0, bValue: b.total_defuses || 0, aBar: progBar(a.total_defuses || 0, b.total_defuses || 0), bBar: progBar(b.total_defuses || 0, a.total_defuses || 0) },
        { label: 'ECON RATING', aValue: (a.avg_econ_rating || 0).toFixed(1), bValue: (b.avg_econ_rating || 0).toFixed(1), aBar: progBar(a.avg_econ_rating || 0, b.avg_econ_rating || 0), bBar: progBar(b.avg_econ_rating || 0, a.avg_econ_rating || 0) },
        { label: 'WIN RATE', aValue: `${Math.round(a.win_rate || 0)}%`, bValue: `${Math.round(b.win_rate || 0)}%`, aBar: progBar(a.win_rate || 0, b.win_rate || 0), bBar: progBar(b.win_rate || 0, a.win_rate || 0) },
        { label: 'MVP', aValue: a.mvp_count || 0, bValue: b.mvp_count || 0, aBar: progBar(a.mvp_count || 0, b.mvp_count || 0), bBar: progBar(b.mvp_count || 0, a.mvp_count || 0) },
        { label: 'GAMES PLAYED', aValue: a.games_played || 0, bValue: b.games_played || 0, aBar: progBar(a.games_played || 0, b.games_played || 0), bBar: progBar(b.games_played || 0, a.games_played || 0) },
        { label: 'ROUNDS PLAYED', aValue: a.total_rounds_played || 0, bValue: b.total_rounds_played || 0, aBar: progBar(a.total_rounds_played || 0, b.total_rounds_played || 0), bBar: progBar(b.total_rounds_played || 0, a.total_rounds_played || 0) },
        { label: 'TOTAL WINS', aValue: a.wins || 0, bValue: b.wins || 0, aBar: progBar(a.wins || 0, b.wins || 0), bBar: progBar(b.wins || 0, a.wins || 0) },
    ];
}

import { NextRequest, NextResponse } from 'next/server';
import { GameDraftService } from '@/services/game-draft';
import { GameRosterService } from '@/services/game-roster';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getMatchWeekAndDay } from '@/services/schedule-utils';

// ── CSV helpers ──
const escapeCsv = (v: any): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
};
const row = (vals: (string | number | null | undefined)[]): string =>
    vals.map(escapeCsv).join(',') + '\r\n';

const N = 'None'; // Filler for missing data

/**
 * Draft CSV export — 15-column grid (A–O)
 *
 * Layout mirrors draft-template-mlbb.csv:
 *   A = Blue label | B–F = Blue data (1–5) | G–I = Centre | J–N = Red data (5–1, reversed) | O = Red label
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId: gameIdStr } = await params;
        const gameId = parseInt(gameIdStr, 10);
        if (isNaN(gameId)) return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });

        const supabase = await getSupabaseServer();

        // ── 1. Game + relations ──
        const { data: game, error: gameError } = await supabase
            .from('games')
            .select(`
                id, game_number, match_id, coin_toss_winner, side_selection,
                match:matches(
                    id, stage_id, best_of, scheduled_at,
                    match_participants(team_id, match_score, team:schools_teams(id, name, school:schools(abbreviation, name))),
                    esports_seasons_stages(season_id, competition_stage, esports_categories(esports(name)))
                ),
                mlbb_map:mlbb_maps(name),
                valorant_map:valorant_maps(name)
            `)
            .eq('id', gameId)
            .single();

        if (gameError || !game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

        // ── 2. Draft + Rosters ──
        const [draftRes, rosterRes] = await Promise.all([
            GameDraftService.getByGameId(gameId),
            GameRosterService.getByGameId(gameId),
        ]);
        if (!draftRes.success || !rosterRes.success)
            return NextResponse.json({ error: 'Failed to fetch draft data' }, { status: 500 });

        // ── 3. Teams ──
        const parts = game.match?.match_participants || [];
        const teams = parts.map((p: any) => {
            if (!p.team) return null;
            const school = Array.isArray(p.team.school) ? p.team.school[0] : p.team.school;
            return { id: p.team.id, name: p.team.name, abbr: school?.abbreviation || N, schoolName: school?.name || N, score: p.match_score || 0 };
        }).filter(Boolean) as { id: string; name: string; abbr: string; schoolName: string; score: number }[];

        // ── 4. Blue / Red side ──
        const coinToss = game.coin_toss_winner || null;
        const sideSel = game.side_selection || null;
        const t1 = teams[0] ?? null;
        const t2 = teams[1] ?? null;
        let blue = t1;
        let red = t2;

        if (coinToss && t1 && t2) {
            if (sideSel === 'blue') {
                blue = coinToss === t1.id ? t1 : t2;
                red = coinToss === t1.id ? t2 : t1;
            } else if (sideSel === 'red') {
                red = coinToss === t1.id ? t1 : t2;
                blue = coinToss === t1.id ? t2 : t1;
            } else {
                blue = coinToss === t1.id ? t1 : t2;
                red = coinToss === t1.id ? t2 : t1;
            }
        }

        const blueId = blue?.id || '';
        const redId = red?.id || '';
        const blueAbbr = blue?.abbr || N;
        const redAbbr = red?.abbr || N;
        const blueName = blue?.schoolName || N;
        const redName = red?.schoolName || N;
        const blueScore = blue?.score ?? 0;
        const redScore = red?.score ?? 0;

        // ── 5. Context info ──
        const esportName = (game.match as any)?.esports_seasons_stages?.esports_categories?.esports?.name || '';
        const seasonId = (game.match as any)?.esports_seasons_stages?.season_id;
        const scheduledAt = (game.match as any)?.scheduled_at || null;
        const isValorant = esportName.toLowerCase().includes('valorant');
        
        const formatHeroName = (name: string | null | undefined) => {
            if (!name || name === N) return N;
            return isValorant ? name.toUpperCase() : name;
        };

        const mapName = game.mlbb_map?.name || game.valorant_map?.name || N;
        const gameNumber = game.game_number || 1;
        const bestOf = (game.match as any)?.best_of || 3;

        let matchWeekAndDay = 'None';
        if (seasonId) {
            matchWeekAndDay = await getMatchWeekAndDay((game.match as any).id, seasonId, scheduledAt);
        }

        // ── 6. Draft actions split by side ──
        const actions = (draftRes.data || []) as any[];
        const blueBans = actions.filter((a: any) => a.team_id === blueId && a.action_type === 'ban').sort((a: any, b: any) => a.sort_order - b.sort_order);
        const redBans = actions.filter((a: any) => a.team_id === redId && a.action_type === 'ban').sort((a: any, b: any) => a.sort_order - b.sort_order);
        const bluePicks = actions.filter((a: any) => a.team_id === blueId && a.action_type === 'pick').sort((a: any, b: any) => a.sort_order - b.sort_order);
        const redPicks = actions.filter((a: any) => a.team_id === redId && a.action_type === 'pick').sort((a: any, b: any) => a.sort_order - b.sort_order);

        // ── 7. Roster ──
        const roster: Record<string, Record<number, { ign: string; role: string }>> = {};
        for (const r of (rosterRes.data || []) as any[]) {
            if (!roster[r.team_id]) roster[r.team_id] = {};
            roster[r.team_id][r.sort_order] = { ign: r.player?.ign || N, role: r.player_role || N };
        }

        // ── 8. Global hero stats (for ban rate) ──
        const heroIds = [...new Set(actions.map((a: any) => a.hero_id).filter(Boolean))] as number[];
        let globalStats: Record<number, any> = {};

        if (heroIds.length > 0 && seasonId) {
            try {
                const view = isValorant ? 'mv_valorant_agent_stats' : 'mv_mlbb_hero_stats';
                const col = isValorant ? 'agent_id' : 'hero_id';
                const { data } = await supabase.from(view as any)
                    .select(`${col}, total_picks, total_bans, total_wins, total_kills, total_deaths, total_assists, total_games`)
                    .in(col, heroIds).eq('season_id', seasonId);
                for (const r of (data || []) as any[]) {
                    const id = r[col];
                    const ex = globalStats[id];
                    if (ex) {
                        ex.total_picks += r.total_picks || 0; ex.total_wins += r.total_wins || 0;
                        ex.total_bans += r.total_bans || 0; ex.total_kills += r.total_kills || 0;
                        ex.total_deaths += r.total_deaths || 0; ex.total_assists += r.total_assists || 0;
                        ex.total_games += r.total_games || 0;
                    } else {
                        globalStats[id] = {
                            total_picks: r.total_picks || 0, total_wins: r.total_wins || 0,
                            total_bans: r.total_bans || 0, total_kills: r.total_kills || 0,
                            total_deaths: r.total_deaths || 0, total_assists: r.total_assists || 0,
                            total_games: r.total_games || 0,
                        };
                    }
                }
            } catch { /* non-fatal */ }
        }

        // ── 9. Team-specific hero stats (for picks) ──
        type Agg = { games: Set<number>; wins: Set<number>; k: number; d: number; a: number; teamGames: number };
        const blueHS: Record<number, Agg> = {};
        const redHS: Record<number, Agg> = {};

        if (heroIds.length > 0 && seasonId) {
            try {
                const tbl = isValorant ? 'stats_valorant_game_player' : 'stats_mlbb_game_player';
                const { data: raw } = await supabase
                    .from(tbl)
                    .select('game_character_id, team_id, kills, deaths, assists, game_id, games!inner(match:matches!inner(stage_id, esports_seasons_stages!inner(season_id)))')
                    .in('game_character_id', heroIds)
                    .in('team_id', [blueId, redId].filter(Boolean))
                    .not('game_character_id', 'is', null);

                const gids = [...new Set((raw || []).map((r: any) => r.game_id))];
                const winners: Record<number, string> = {};
                if (gids.length > 0) {
                    const { data: w } = await supabase.from('view_game_winners' as any).select('game_id, winner_team_id').in('game_id', gids);
                    for (const r of (w || []) as any[]) if (r.game_id && r.winner_team_id) winners[r.game_id] = r.winner_team_id;
                }

                const tgSets: Record<string, Set<number>> = {};
                for (const r of (raw || []) as any[]) {
                    const hid = r.game_character_id, tid = r.team_id;
                    if (!hid || !tid) continue;
                    if (r.games?.match?.esports_seasons_stages?.season_id !== seasonId) continue;

                    if (!tgSets[tid]) tgSets[tid] = new Set();
                    tgSets[tid].add(r.game_id);

                    const store = tid === blueId ? blueHS : redHS;
                    if (!store[hid]) store[hid] = { games: new Set(), wins: new Set(), k: 0, d: 0, a: 0, teamGames: 0 };
                    const ag = store[hid];
                    if (!ag.games.has(r.game_id)) {
                        ag.games.add(r.game_id);
                        if (winners[r.game_id] === tid) ag.wins.add(r.game_id);
                    }
                    ag.k += r.kills || 0; ag.d += r.deaths || 0; ag.a += r.assists || 0;
                }
                for (const hid of heroIds) {
                    if (blueHS[hid]) blueHS[hid].teamGames = tgSets[blueId]?.size || 0;
                    if (redHS[hid]) redHS[hid].teamGames = tgSets[redId]?.size || 0;
                }
            } catch (e) { console.warn('Team hero stats error:', e); }
        }

        // ── 10. Draft history from previous games ──
        let draftHistory: { blueBans: string[]; redBans: string[]; bluePicks: string[]; redPicks: string[] }[] = [];
        if (game.match_id) {
            try {
                const { data: allGames } = await supabase
                    .from('games')
                    .select('id, game_number')
                    .eq('match_id', game.match_id)
                    .order('game_number', { ascending: true });

                const otherGameIds = (allGames || [])
                    .filter((g: any) => g.id !== gameId)
                    .map((g: any) => g.id);

                if (otherGameIds.length > 0) {
                    const { data: otherDrafts } = await supabase
                        .from('game_draft_actions')
                        .select('game_id, team_id, action_type, hero_name, sort_order')
                        .in('game_id', otherGameIds)
                        .in('action_type', ['ban', 'pick'])
                        .order('sort_order', { ascending: true });

                    // Group by game
                    const byGame: Record<number, any[]> = {};
                    for (const d of (otherDrafts || []) as any[]) {
                        if (!byGame[d.game_id]) byGame[d.game_id] = [];
                        byGame[d.game_id].push(d);
                    }

                    // Map game_id to game_number for ordering
                    const gameOrder = (allGames || []).filter((g: any) => g.id !== gameId);
                    for (const g of gameOrder) {
                        const gameDrafts = byGame[g.id] || [];
                        // Determine which team was blue/red in that game (approximate: use same blueId/redId)
                        const bBans = gameDrafts.filter((d: any) => d.team_id === blueId && d.action_type === 'ban').map((d: any) => formatHeroName(d.hero_name));
                        const rBans = gameDrafts.filter((d: any) => d.team_id === redId && d.action_type === 'ban').map((d: any) => formatHeroName(d.hero_name));
                        const bPicks = gameDrafts.filter((d: any) => d.team_id === blueId && d.action_type === 'pick').map((d: any) => formatHeroName(d.hero_name));
                        const rPicks = gameDrafts.filter((d: any) => d.team_id === redId && d.action_type === 'pick').map((d: any) => formatHeroName(d.hero_name));
                        draftHistory.push({
                            blueBans: pad5(bBans),
                            redBans: pad5(rBans),
                            bluePicks: pad5(bPicks),
                            redPicks: pad5(rPicks),
                        });
                    }
                }
            } catch { /* non-fatal */ }
        }

        // ── Helpers ──
        function pad5(arr: string[]): string[] {
            const r = arr.slice(0, 5);
            while (r.length < 5) r.push(N);
            return r;
        }
        const heroName = (a: any) => formatHeroName(a?.hero_name);

        const fmtBanRate = (hid: number | null): string => {
            if (!hid) return N;
            const g = globalStats[hid];
            if (!g || !g.total_bans) return N;
            const totalAppearances = (g.total_bans || 0) + (g.total_picks || 0);
            if (totalAppearances === 0) return N;
            return `${((g.total_bans / totalAppearances) * 100).toFixed(0)}%`;
        };
        const fmtWR = (hid: number | null, store: Record<number, Agg>): string => {
            if (!hid) return N;
            const a = store[hid];
            if (!a || a.games.size === 0) return N;
            return `${((a.wins.size / a.games.size) * 100).toFixed(0)}%`;
        };
        const fmtKDA = (hid: number | null, store: Record<number, Agg>): string => {
            if (!hid) return N;
            const a = store[hid];
            if (!a) return N;
            if (a.d === 0) return a.k + a.a > 0 ? `${(a.k + a.a).toFixed(1)}` : N;
            return ((a.k + a.a) / a.d).toFixed(2);
        };
        const fmtPR = (hid: number | null, store: Record<number, Agg>): string => {
            if (!hid) return N;
            const a = store[hid];
            if (!a || a.teamGames === 0) return N;
            return `${((a.games.size / a.teamGames) * 100).toFixed(0)}%`;
        };

        // Padded arrays (1–5)
        const bBanNames = pad5(blueBans.map(heroName));
        const rBanNames = pad5(redBans.map(heroName));
        const bPickNames = pad5(bluePicks.map(heroName));
        const rPickNames = pad5(redPicks.map(heroName));
        const bBanIds = blueBans.map((a: any) => a.hero_id || null); while (bBanIds.length < 5) bBanIds.push(null);
        const rBanIds = redBans.map((a: any) => a.hero_id || null); while (rBanIds.length < 5) rBanIds.push(null);
        const bPickIds = bluePicks.map((a: any) => a.hero_id || null); while (bPickIds.length < 5) bPickIds.push(null);
        const rPickIds = redPicks.map((a: any) => a.hero_id || null); while (rPickIds.length < 5) rPickIds.push(null);
        const bIgns = pad5(Array.from({ length: 5 }, (_, i) => roster[blueId]?.[i]?.ign || N));
        const rIgns = pad5(Array.from({ length: 5 }, (_, i) => roster[redId]?.[i]?.ign || N));
        const bRoles = pad5(Array.from({ length: 5 }, (_, i) => roster[blueId]?.[i]?.role || N));
        const rRoles = pad5(Array.from({ length: 5 }, (_, i) => roster[redId]?.[i]?.role || N));

        const esportAbbrev = isValorant ? 'VALORANT' : 'MLBB';
        const bPaths = pad5(Array.from({ length: 5 }, (_, i) => `C:\\Users\\CESAFI\\Desktop\\CEL S4\\IMAGES\\Players\\${blueAbbr}\\${esportAbbrev}\\${bIgns[i]}_Formal.png`));
        const rPaths = pad5(Array.from({ length: 5 }, (_, i) => `C:\\Users\\CESAFI\\Desktop\\CEL S4\\IMAGES\\Players\\${redAbbr}\\${esportAbbrev}\\${rIgns[i]}_Formal.png`));

        // Red side is REVERSED in the template (5,4,3,2,1)
        const rev = <T,>(a: T[]) => [...a].reverse();

        // ═══════════════════════════════════════════
        //  BUILD CSV — 15 columns (A–O)
        //  Matches draft-template-mlbb.csv exactly
        // ═══════════════════════════════════════════
        let csv = '';

        // Row 1: BLUE,,,,,,,MLBB DRAFTING,WEEK X DAY Y,,,,,,RED
        csv += row(['BLUE', '', '', '', '', '', '', isValorant ? 'VALORANT DRAFTING' : 'MLBB DRAFTING', matchWeekAndDay, '', '', '', '', '', 'RED']);

        // Row 2: SCHOOL ABBREVIATION,,,,,,SCORE,BO3,SCORE,,,,,,SCHOOL ABBREVIATION
        csv += row([blueAbbr, '', '', '', '', '', 'SCORE', `BO${bestOf}`, 'SCORE', '', '', '', '', '', redAbbr]);

        // Row 3: SCHOOL NAME,,,,,,score,GAME N,score,,,,,,SCHOOL NAME
        csv += row([blueName, '', '', '', '', '', blueScore, `GAME ${gameNumber}`, redScore, '', '', '', '', '', redName]);

        // Row 4: ,,,,,,,MAP,,,,,,,
        csv += row(['', '', '', '', '', '', '', 'MAP', '', '', '', '', '', '', '']);

        // Row 5: BANS,BAN1..5,,mapName,,BAN5..1,BANS
        csv += row(['BANS', ...bBanNames, '', mapName, '', ...rev(rBanNames), 'BANS']);

        // Row 6: BAN RATE
        csv += row(['BAN RATE', ...bBanIds.map(fmtBanRate), '', '', '', ...rev(rBanIds).map(fmtBanRate), 'BAN RATE']);

        // Row 7: player paths
        csv += row(['', ...bPaths, '', '', '', ...rev(rPaths), '']);

        // Row 8: PLAYERS
        csv += row(['PLAYERS', ...bIgns, '', '', '', ...rev(rIgns), 'PLAYERS']);

        // Row 9: ROLES
        csv += row(['ROLES', ...bRoles, '', '', '', ...rev(rRoles), 'ROLES']);

        // Row 10: empty
        csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

        // Row 11: PICKS
        csv += row(['PICKS', ...bPickNames, '', '', '', ...rev(rPickNames), 'PICKS']);

        // Row 12: KDA
        csv += row(['KDA', ...bPickIds.map(id => fmtKDA(id, blueHS)), '', '', '', ...rev(rPickIds).map(id => fmtKDA(id, redHS)), 'KDA']);

        // Row 13: WR (win rate)
        csv += row(['WR', ...bPickIds.map(id => fmtWR(id, blueHS)), '', '', '', ...rev(rPickIds).map(id => fmtWR(id, redHS)), 'WR']);

        // Row 14: PICK RATE
        csv += row(['PICK RATE', ...bPickIds.map(id => fmtPR(id, blueHS)), '', '', '', ...rev(rPickIds).map(id => fmtPR(id, redHS)), 'PICK RATE']);

        // Rows 15-17: empty
        csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

        // Rows 18+: Draft history (GAME 1 BAN, GAME 1 PICK, GAME 2 BAN, GAME 2 PICK, etc)
        const totalGames = bestOf || 3;
        for (let i = 1; i <= totalGames; i++) {
            const hist = draftHistory[i - 1];
            const banLabel = `GAME ${i} BAN`;
            const pickLabel = `GAME ${i} PICK`;
            if (hist) {
                csv += row([banLabel, ...hist.blueBans, '', '', '', ...rev(hist.redBans), banLabel]);
                csv += row([pickLabel, ...hist.bluePicks, '', '', '', ...rev(hist.redPicks), pickLabel]);
            } else {
                csv += row([banLabel, N, N, N, N, N, '', '', '', N, N, N, N, N, banLabel]);
                csv += row([pickLabel, N, N, N, N, N, '', '', '', N, N, N, N, N, pickLabel]);
            }
        }

        // ── Return CSV ──
        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="draft-game-${gameId}.csv"`,
                'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
            },
        });

    } catch (error) {
        console.error('Error generating draft CSV:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

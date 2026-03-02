import { NextRequest, NextResponse } from 'next/server';
import { GameDraftService } from '@/services/game-draft';
import { GameRosterService } from '@/services/game-roster';
import { formatResponse, getFormatParam, vmixResponse } from '@/lib/utils/vmix-format';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Public API endpoint for fetching game draft state.
 * Used by external overlays (like OBS) to display live drafts.
 * Enhanced: includes character_stats with pick/win rates and avg KDA for each drafted character.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId: gameIdStr } = await params;
        const gameId = parseInt(gameIdStr, 10);
        const format = getFormatParam(request);
        const table = new URL(request.url).searchParams.get('table') as string | null;

        if (isNaN(gameId)) {
            return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
        }

        // We use getSupabaseServer just for the raw game fetch to get team context
        const supabase = await getSupabaseServer();
        const { data: game, error: gameError } = await supabase
            .from('games')
            .select(`
                *,
                match:matches(
                    stage_id,
                    match_participants(
                        team_id,
                        team:schools_teams(
                            id, 
                            name, 
                            school:schools(abbreviation, logo_url)
                        )
                    ),
                    esports_seasons_stages(
                        season_id,
                        esports_categories(
                            esports(name)
                        )
                    )
                ),
                mlbb_map:mlbb_maps(name),
                valorant_map:valorant_maps(name)
            `)
            .eq('id', gameId)
            .single();

        if (gameError || !game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Fetch draft actions and rosters in parallel
        const [draftRes, rosterRes] = await Promise.all([
            GameDraftService.getByGameId(gameId),
            GameRosterService.getByGameId(gameId)
        ]);

        if (!draftRes.success || !rosterRes.success) {
            return NextResponse.json({ error: 'Failed to fetch draft data' }, { status: 500 });
        }

        const matchTeams = game.match?.match_participants || [];
        const teams = matchTeams.map((p: any) => {
            if (!p.team) return null;

            // Handle both array and single object returns for school relation
            const schoolData = Array.isArray(p.team.school) ? p.team.school[0] : p.team.school;

            return {
                id: p.team.id,
                name: p.team.name,
                abbreviation: schoolData?.abbreviation || null,
                logo_url: schoolData?.logo_url || null
            };
        }).filter(Boolean);

        // --- Character Stats Enhancement ---
        // Determine game type from esport name and fetch character stats
        const esportName = (game.match as any)?.esports_seasons_stages?.esports_categories?.esports?.name || '';
        const seasonId = (game.match as any)?.esports_seasons_stages?.season_id;
        const isValorant = esportName.toLowerCase().includes('valorant');

        let characterStatsMap: Record<number, any> = {};

        // Collect unique hero/agent IDs from draft actions
        const draftActions = draftRes.data || [];
        const heroIds = [...new Set(
            draftActions
                .map((a: any) => a.hero_id)
                .filter((id: any) => id != null)
        )] as number[];

        if (heroIds.length > 0) {
            try {
                if (isValorant) {
                    const { data: agentStats } = await supabase
                        .from('mv_valorant_agent_stats' as any)
                        .select('*')
                        .in('agent_id', heroIds)
                        .eq('season_id', seasonId);

                    // Aggregate by agent_id (may have multiple rows per stage)
                    const agentMap = new Map<number, any>();
                    for (const row of (agentStats as any[]) || []) {
                        const existing = agentMap.get(row.agent_id);
                        if (existing) {
                            existing.total_picks += row.total_picks;
                            existing.total_wins += row.total_wins;
                            existing.total_kills += row.total_kills;
                            existing.total_deaths += row.total_deaths;
                            existing.total_assists += row.total_assists;
                        } else {
                            agentMap.set(row.agent_id, { ...row });
                        }
                    }

                    for (const [id, row] of agentMap) {
                        const picks = row.total_picks || 0;
                        characterStatsMap[id] = {
                            character_id: id,
                            character_name: row.agent_name,
                            icon_url: row.icon_url,
                            role: row.agent_role,
                            total_picks: picks,
                            total_wins: row.total_wins,
                            win_rate: picks > 0 ? ((row.total_wins / picks) * 100).toFixed(1) : '0.0',
                            avg_kills: picks > 0 ? (row.total_kills / picks).toFixed(1) : '0.0',
                            avg_deaths: picks > 0 ? (row.total_deaths / picks).toFixed(1) : '0.0',
                            avg_assists: picks > 0 ? (row.total_assists / picks).toFixed(1) : '0.0',
                            avg_kda: row.total_deaths > 0
                                ? ((row.total_kills + row.total_assists) / row.total_deaths).toFixed(2)
                                : (row.total_kills + row.total_assists).toFixed(2),
                        };
                    }
                } else {
                    // MLBB
                    const { data: heroStats } = await supabase
                        .from('mv_mlbb_hero_stats' as any)
                        .select('*')
                        .in('hero_id', heroIds)
                        .eq('season_id', seasonId);

                    // Aggregate by hero_id
                    const heroMap = new Map<number, any>();
                    for (const row of (heroStats as any[]) || []) {
                        const existing = heroMap.get(row.hero_id);
                        if (existing) {
                            existing.total_picks += row.total_picks;
                            existing.total_wins += row.total_wins;
                            existing.total_kills += row.total_kills;
                            existing.total_deaths += row.total_deaths;
                            existing.total_assists += row.total_assists;
                            existing.avg_gold_weighted += (row.avg_gold || 0) * row.total_picks;
                            existing.avg_damage_weighted += (row.avg_damage || 0) * row.total_picks;
                        } else {
                            heroMap.set(row.hero_id, {
                                ...row,
                                avg_gold_weighted: (row.avg_gold || 0) * row.total_picks,
                                avg_damage_weighted: (row.avg_damage || 0) * row.total_picks,
                            });
                        }
                    }

                    for (const [id, row] of heroMap) {
                        const picks = row.total_picks || 0;
                        characterStatsMap[id] = {
                            character_id: id,
                            character_name: row.hero_name,
                            icon_url: row.icon_url,
                            total_picks: picks,
                            total_wins: row.total_wins,
                            win_rate: picks > 0 ? ((row.total_wins / picks) * 100).toFixed(1) : '0.0',
                            avg_kills: picks > 0 ? (row.total_kills / picks).toFixed(1) : '0.0',
                            avg_deaths: picks > 0 ? (row.total_deaths / picks).toFixed(1) : '0.0',
                            avg_assists: picks > 0 ? (row.total_assists / picks).toFixed(1) : '0.0',
                            avg_kda: row.total_deaths > 0
                                ? ((row.total_kills + row.total_assists) / row.total_deaths).toFixed(2)
                                : (row.total_kills + row.total_assists).toFixed(2),
                            avg_gold: picks > 0 ? Math.round(row.avg_gold_weighted / picks) : 0,
                            avg_damage: picks > 0 ? Math.round(row.avg_damage_weighted / picks) : 0,
                        };
                    }
                }
            } catch (statsError) {
                // Non-fatal: if stats fail, just return empty map
                console.warn('Failed to fetch character stats for draft:', statsError);
            }
        }

        // Build a team ID → display info lookup
        const teamLookup: Record<string, { name: string; abbreviation: string }> = {};
        for (const t of teams) {
            if (t) teamLookup[t.id] = { name: t.name, abbreviation: t.abbreviation || '' };
        }

        // Build roster lookup: team_id → sort_order → player IGN
        const rosterLookup: Record<string, Record<number, string>> = {};
        for (const r of (rosterRes.data || []) as any[]) {
            const tid = r.team_id;
            if (!rosterLookup[tid]) rosterLookup[tid] = {};
            rosterLookup[tid][r.sort_order] = r.player?.ign || '';
        }

        // ── vMix-friendly flat output (csv / json-flat / xml) ──
        // ── Output padding for vMix ──
        const mapName = game.mlbb_map?.name || game.valorant_map?.name || '';
        const gameNumber = game.game_number || 1;

        if (format !== 'json') {
            const rawBoard = (draftRes.data || []).map((action: any, idx: number) => {
                const stats = action.hero_id ? characterStatsMap[action.hero_id] : null;
                const teamInfo = action.team_id ? teamLookup[action.team_id] : null;

                // For IGN mapping, first check if drafted action has a player relation.
                // Otherwise, fallback to the roster lookup based on the team's sort order mapping.
                // Draft actions in MLBB are typically: 10 bans (sort 1-5, 6-10), 10 picks (sort 11-15, 16-20)
                let playerIgn = action.player?.ign || '';

                // If it's a pick action and no explicitly joined player IGN exists, try fallback
                if (!playerIgn && action.action_type === 'pick' && action.team_id) {
                    // Try to guess the slot based on index or let the client/overlay handle it.
                    // The easiest guess is `sort_order` or mapping the Nth pick to the Nth roster order.

                    // We can map action.sort_order directly. MLBB often maps pick 1 to roster 1.
                    // If not, we fall back to finding the first available roster spot.
                    playerIgn = rosterLookup[action.team_id]?.[action.sort_order] || '';
                    if (!playerIgn) {
                        playerIgn = Object.values(rosterLookup[action.team_id] || {})[0] || '';
                    }
                }

                return {
                    order: idx + 1,
                    action: action.action_type || '',
                    team: teamInfo?.abbreviation || teamInfo?.name || '',
                    hero: stats?.character_name || action.hero_name || '',
                    player: playerIgn,
                    win_rate: stats?.win_rate ? `${stats.win_rate}%` : '',
                    total_picks: stats?.total_picks ?? '',
                    avg_kda: stats?.avg_kda || '',
                    map: mapName,
                    game_number: gameNumber
                };
            });

            // Calculate max rows needed based on format
            // Valorant: usually 10 picks
            // MLBB: 10 bans + 10 picks = 20
            const maxRows = isValorant ? 10 : 20;

            const draftBoard = [];
            for (let i = 0; i < maxRows; i++) {
                if (i < rawBoard.length) {
                    draftBoard.push({ ...rawBoard[i], order: i + 1 });
                } else {
                    // Filler row
                    draftBoard.push({
                        order: i + 1,
                        action: '',
                        team: '',
                        hero: '',
                        player: '',
                        win_rate: '',
                        total_picks: '',
                        avg_kda: '',
                        map: mapName,
                        game_number: gameNumber
                    });
                }
            }

            // Support ?table= for pulling specific sub-data
            if (table) {
                const tables: Record<string, any[]> = {
                    draft: draftBoard,
                    teams: teams.map((t: any) => ({
                        team: t.name,
                        school: t.abbreviation || '',
                        logo_url: t.logo_url || '',
                    })),
                    rosters: (rosterRes.data || []).map((r: any) => ({
                        team: teamLookup[r.team_id]?.abbreviation || teamLookup[r.team_id]?.name || '',
                        slot: r.sort_order,
                        player: r.player?.ign || '',
                        role: r.player?.role || '',
                    })),
                };
                const selected = tables[table];
                if (!selected) {
                    return NextResponse.json(
                        { error: `Unknown table: ${table}. Available: ${Object.keys(tables).join(', ')}` },
                        { status: 400 }
                    );
                }
                return vmixResponse(selected, format, table);
            }

            // Default flat: return the draft board
            return vmixResponse(draftBoard, format, 'draft');
        }

        // ── Default JSON (backward compatible, full payload) ──
        return vmixResponse({
            game: {
                id: game.id,
                game_number: game.game_number,
                map_name: game.mlbb_map?.name || game.valorant_map?.name || '',
            },
            teams,
            draft_actions: draftRes.data,
            rosters: rosterRes.data,
            character_stats: characterStatsMap
        }, format, 'draft');

    } catch (error) {
        console.error('Error fetching game draft:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


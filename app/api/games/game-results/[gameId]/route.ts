import { NextRequest, NextResponse } from 'next/server'
import { StatsMlbbService } from '@/services/stats-mlbb'
import { StatsValorantService } from '@/services/stats-valorant'
import { GameDraftService } from '@/services/game-draft'
import { GameRosterService } from '@/services/game-roster'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getMatchWeekAndDay } from '@/services/schedule-utils'

// ── CSV helpers ──
const escapeCsv = (v: any): string => {
  if (v === null || v === undefined) return ''
  const s = String(v)
  // Bypass escaping if it's already an Excel text formula to prevent Excel from converting to dates
  if (s.startsWith('="') && s.endsWith('"')) return s
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}
const row = (vals: (string | number | null | undefined)[]): string => vals.map(escapeCsv).join(',') + '\r\n'

const N = 'None' // Filler for missing data

/**
 * Game Results CSV export — grid layout
 *
 * MLBB:  17-column grid (A–Q) matching game-results-mlbb.csv
 * Valo:  15-column grid (A–O) matching game-results-valo.csv
 *
 * Layout mirrors the templates:
 *   A = Blue label | B–F = Blue data (1–5) | G–I = Centre | J–N = Red data (5–1, reversed) | O = Red label
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId: gameIdStr } = await params
    const gameId = parseInt(gameIdStr, 10)
    if (isNaN(gameId)) return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 })

    const supabase = await getSupabaseServer()

    // ── 1. Game + relations ──
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(
        `
                *,
                match:matches(
                    id, stage_id, best_of, scheduled_at,
                    match_participants(id, team_id, match_score, team:schools_teams(id, name, school:schools(abbreviation, name))),
                    esports_seasons_stages(season_id, competition_stage, esports_categories(esports(name)))
                ),
                mlbb_map:mlbb_maps(name),
                valorant_map:valorant_maps(name)
            `,
      )
      .eq('id', gameId)
      .single()

    if (gameError || !game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

    // ── 2. Draft + Rosters + Stats ──
    const parts = game.match?.match_participants || []
    const esportName = (game.match as any)?.esports_seasons_stages?.esports_categories?.esports?.name || ''
    const isValorant = esportName.toLowerCase().includes('valorant')

    const [draftRes, rosterRes, statsRes] = await Promise.all([
      GameDraftService.getByGameId(gameId),
      GameRosterService.getByGameId(gameId),
      isValorant ? StatsValorantService.getByGameId(gameId) : StatsMlbbService.getByGameId(gameId),
    ])

    if (!rosterRes.success || !statsRes.success)
      return NextResponse.json({ error: 'Failed to fetch game data' }, { status: 500 })

    // ── 3. Teams ──
    const teams = parts
      .map((p: any) => {
        if (!p.team) return null
        const school = Array.isArray(p.team.school) ? p.team.school[0] : p.team.school
        return {
          id: p.team.id,
          name: p.team.name,
          abbr: school?.abbreviation || N,
          schoolName: school?.name || N,
          score: p.match_score || 0,
          participantId: p.id,
        }
      })
      .filter(Boolean) as {
      id: string
      name: string
      abbr: string
      schoolName: string
      score: number
      participantId: number
    }[]

    // ── 4. Blue / Red side ──
    const coinToss = game.coin_toss_winner || null
    const sideSel = game.side_selection || null
    const t1 = teams[0] ?? null
    const t2 = teams[1] ?? null
    let blue = t1
    let red = t2

    if (coinToss && t1 && t2) {
      if (sideSel === 'blue') {
        blue = coinToss === t1.id ? t1 : t2
        red = coinToss === t1.id ? t2 : t1
      } else if (sideSel === 'red') {
        red = coinToss === t1.id ? t1 : t2
        blue = coinToss === t1.id ? t2 : t1
      } else {
        blue = coinToss === t1.id ? t1 : t2
        red = coinToss === t1.id ? t2 : t1
      }
    }

    const blueId = blue?.id || ''
    const redId = red?.id || ''
    const blueAbbr = blue?.abbr || N
    const redAbbr = red?.abbr || N
    const blueName = blue?.schoolName || N
    const redName = red?.schoolName || N
    const blueScore = blue?.score ?? 0
    const redScore = red?.score ?? 0

    // ── 5. Context info ──
    const mapName = game.mlbb_map?.name || game.valorant_map?.name || N
    const gameNumber = game.game_number || 1
    const bestOf = (game.match as any)?.best_of || 3

    const seasonId = (game.match as any)?.esports_seasons_stages?.season_id
    const scheduledAt = (game.match as any)?.scheduled_at || null
    let matchWeekAndDay = 'None'
    if (seasonId) {
      matchWeekAndDay = await getMatchWeekAndDay((game.match as any).id, seasonId, scheduledAt)
    }

    // ── 6. Roster ──
    const roster: Record<string, Record<number, { ign: string; role: string }>> = {}
    const rosterByPlayer: Record<string, { ign: string; role: string }> = {}
    for (const r of (rosterRes.data || []) as any[]) {
      if (!roster[r.team_id]) roster[r.team_id] = {}
      roster[r.team_id][r.sort_order] = { ign: r.player?.ign || N, role: r.player_role || N }
      if (r.player_id) {
        rosterByPlayer[r.player_id] = { ign: r.player?.ign || N, role: r.player_role || N }
      }
    }

    // ── 7. Stats split by team, ordered by slot ──
    const allStats = (statsRes.data || []) as any[]
    const blueStats = allStats
      .filter((s: any) => s.team_id === blueId)
      .sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999))
    const redStats = allStats
      .filter((s: any) => s.team_id === redId)
      .sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999))

    // ── 8. Draft picks (for hero/agent names per player slot) ──
    const draftActions = (draftRes.success ? draftRes.data || [] : []) as any[]
    const bluePicks = draftActions
      .filter((a: any) => a.team_id === blueId && a.action_type === 'pick')
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
    const redPicks = draftActions
      .filter((a: any) => a.team_id === redId && a.action_type === 'pick')
      .sort((a: any, b: any) => a.sort_order - b.sort_order)

    // ── Helpers ──
    function pad5(arr: any[]): any[] {
      const r = arr.slice(0, 5)
      while (r.length < 5) r.push(null)
      return r
    }
    const rev = <T>(a: T[]) => [...a].reverse()
    const v = (val: any, fallback: string | number = 0) => val ?? fallback

    // Padded arrays — derived from stats order, with roles from game_rosters by player_id
    const bIgns = pad5(blueStats.map((s) => rosterByPlayer[s.player_id]?.ign || s.players?.ign || N))
    const rIgns = pad5(redStats.map((s) => rosterByPlayer[s.player_id]?.ign || s.players?.ign || N))
    const bRoles = pad5(blueStats.map((s) => rosterByPlayer[s.player_id]?.role || N))
    const rRoles = pad5(redStats.map((s) => rosterByPlayer[s.player_id]?.role || N))

    // Hero/agent names from draft picks or stats
    const getPickName = (stats: any[], picks: any[], idx: number): string => {
      // Try draft pick first
      if (picks[idx]?.hero_name) return picks[idx].hero_name
      // Fallback to game_characters from stats
      if (stats[idx]?.game_characters?.name) return stats[idx].game_characters.name
      return N
    }
    const bPickNames = pad5(Array.from({ length: 5 }, (_, i) => getPickName(blueStats, bluePicks, i)))
    const rPickNames = pad5(Array.from({ length: 5 }, (_, i) => getPickName(redStats, redPicks, i)))

    // Stat accessors
    const bStat = (idx: number, key: string) => v(blueStats[idx]?.[key])
    const rStat = (idx: number, key: string) => v(redStats[idx]?.[key])
    const bStatRow = (key: string) => Array.from({ length: 5 }, (_, i) => bStat(i, key))
    const rStatRow = (key: string) => Array.from({ length: 5 }, (_, i) => rStat(i, key))

    // ── 9. Game scores (Valorant rounds) ──
    let blueRounds = 0
    let redRounds = 0
    if (isValorant) {
      try {
        const { data: scores } = await supabase
          .from('game_scores')
          .select('match_participant_id, score')
          .eq('game_id', gameId)

        if (scores) {
          for (const s of scores as any[]) {
            if (s.match_participant_id === blue?.participantId) blueRounds = s.score || 0
            if (s.match_participant_id === red?.participantId) redRounds = s.score || 0
          }
        }
      } catch {
        /* non-fatal */
      }
    }

    // ── 10. Find MVP ──
    const mvp = allStats.find((s: any) => s.is_mvp === true)
    const mvpIgn = mvp?.players?.ign || N
    const mvpSchoolName = mvp?.schools_teams?.schools?.name || N
    const mvpSchoolAbbr = mvp?.schools_teams?.schools?.abbreviation || N
    const mvpRole = mvp?.players?.role || N
    const mvpPick = mvp?.game_characters?.name || N

    // ═══════════════════════════════════════════
    //  BUILD CSV
    // ═══════════════════════════════════════════
    let csv = ''

    if (isValorant) {
      // ─── VALORANT: 15 columns (A–O) ───
      // Row 1: BLUE,,,,,,,VALO GAME RESULTS,WEEK X DAY Y,,,,,,RED
      csv += row(['BLUE', '', '', '', '', '', '', 'VALO GAME RESULTS', matchWeekAndDay, '', '', '', '', '', 'RED'])

      // Row 2: SCHOOL ABBREVIATION,,,,,,SCORE,BO3,SCORE,,,,,,SCHOOL ABBREVIATION
      csv += row([blueAbbr, '', '', '', '', '', 'SCORE', `BO${bestOf}`, 'SCORE', '', '', '', '', '', redAbbr])

      // Row 3: SCHOOL FULL NAME,,,,,,matchScore,GAME N,matchScore,,,,,,SCHOOL FULL NAME
      csv += row([blueName, '', '', '', '', '', blueScore, `GAME ${gameNumber}`, redScore, '', '', '', '', '', redName])

      // Row 4: ,,,,,,ROUNDS,MAP,ROUNDS,,,,,,
      csv += row(['', '', '', '', '', '', 'ROUNDS', 'MAP', 'ROUNDS', '', '', '', '', '', ''])

      // Row 5: ,,,,,,blueRounds,mapName,redRounds,,,,,,
      csv += row(['', '', '', '', '', '', blueRounds, mapName, redRounds, '', '', '', '', '', ''])

      // Rows 6-7: empty
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])

      // Row 8: PLAYERS
      csv += row(['', ...bIgns, '', 'PLAYERS', '', ...rev(rIgns), ''])

      // Row 9: ROLES
      csv += row(['', ...bRoles, '', 'ROLES', '', ...rev(rRoles), ''])

      // Row 10: empty
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])

      // Row 11: PICKS
      csv += row([
        '',
        ...bPickNames.map((n) => n.toUpperCase()),
        '',
        'PICKS',
        '',
        ...rev(rPickNames.map((n) => n.toUpperCase())),
        '',
      ])

      // Row 12: KILLS
      csv += row(['', ...bStatRow('kills'), '', 'KILLS', '', ...rev(rStatRow('kills')), ''])

      // Row 13: DEATHS
      csv += row(['', ...bStatRow('deaths'), '', 'DEATHS', '', ...rev(rStatRow('deaths')), ''])

      // Row 14: ASSISTS
      csv += row(['', ...bStatRow('assists'), '', 'ASSISTS', '', ...rev(rStatRow('assists')), ''])

      // Row 15: ACS
      csv += row(['', ...bStatRow('acs'), '', 'ACS', '', ...rev(rStatRow('acs')), ''])

      // Row 16: ECON RATING
      csv += row(['', ...bStatRow('econ_rating'), '', 'ECON RATING', '', ...rev(rStatRow('econ_rating')), ''])

      // Row 17: FIRST BLOODS
      csv += row(['', ...bStatRow('first_bloods'), '', 'FIRST BLOODS', '', ...rev(rStatRow('first_bloods')), ''])

      // Row 18: PLANTS
      csv += row(['', ...bStatRow('plants'), '', 'PLANTS', '', ...rev(rStatRow('plants')), ''])

      // Row 19: DEFUSES
      csv += row(['', ...bStatRow('defuses'), '', 'DEFUSES', '', ...rev(rStatRow('defuses')), ''])

      // Row 20: K/D/A
      const bKda = Array.from(
        { length: 5 },
        (_, i) => `${bStat(i, 'kills')}/${bStat(i, 'deaths')}/${bStat(i, 'assists')}`,
      )
      const rKda = Array.from(
        { length: 5 },
        (_, i) => `${rStat(i, 'kills')}/${rStat(i, 'deaths')}/${rStat(i, 'assists')}`,
      )
      csv += row(['', ...bKda, '', 'K/D/A', '', ...rev(rKda), ''])

      // Rows 21-25: empty
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])

      // Row 26: MVP header
      csv += row([
        'MVP',
        'MVP IGN',
        'SCHOOL FULL NAME',
        'SCHOOL ABBREVIATION',
        'ROLE',
        'PICK',
        'KILLS',
        'DEATHS',
        'ASSISTS',
        'ACS',
        'ECON RATINGG',
        'FIRST BLOODS',
        'PLANTS',
        'DEFUSES',
        'K/D/A',
        '',
      ])

      // Row 26: MVP data
      csv += row([
        '',
        mvpIgn,
        mvpSchoolName,
        mvpSchoolAbbr,
        mvpRole,
        mvpPick.toUpperCase(),
        v(mvp?.kills),
        v(mvp?.deaths),
        v(mvp?.assists),
        v(mvp?.acs),
        v(mvp?.econ_rating),
        v(mvp?.first_bloods),
        v(mvp?.plants),
        v(mvp?.defuses),
        v(mvp ? `${mvp.kills}/${mvp.deaths}/${mvp.assists}` : N),
        '',
      ])
    } else {
      // ─── MLBB: 17 columns (A–Q, extra 2 empty trailing) ───
      // Row 1: BLUE,,,,,,,MLBB GAME RESULTS,WEEK X DAY Y,,,,,RED,,
      csv += row([
        'BLUE',
        '',
        '',
        '',
        '',
        '',
        '',
        'MLBB GAME RESULTS',
        matchWeekAndDay,
        '',
        '',
        '',
        '',
        '',
        'RED',
        '',
        '',
      ])

      // Row 2: SCHOOL ABBREVIATION,,,,,,SCORE,BO3,SCORE,,,,,,SCHOOL ABBREVIATION,,
      csv += row([blueAbbr, '', '', '', '', '', 'SCORE', `BO${bestOf}`, 'SCORE', '', '', '', '', '', redAbbr, '', ''])

      // Row 3: SCHOOL FULL NAME,,,,,,,GAME N,,,,,,,SCHOOL FULL NAME,,
      csv += row([blueName, '', '', '', '', '', '', `GAME ${gameNumber}`, '', '', '', '', '', '', redName, '', ''])

      // Row 4: ,,,,,,,MAP,,,,,,,,,
      csv += row(['', '', '', '', '', '', '', 'MAP', '', '', '', '', '', '', '', '', ''])

      // Row 5: ,,,,,,,mapName,,,,,,,,,
      csv += row(['', '', '', '', '', '', '', mapName, '', '', '', '', '', '', '', '', ''])

      // Rows 6-7: empty
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])

      // Row 8: PLAYERS
      csv += row(['', ...bIgns, '', 'PLAYERS', '', ...rev(rIgns), '', '', ''])

      // Row 9: ROLES
      csv += row(['', ...bRoles, '', 'ROLES', '', ...rev(rRoles), '', '', ''])

      // Row 10: empty
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])

      // Row 11: PICKS
      csv += row(['', ...bPickNames, '', 'PICKS', '', ...rev(rPickNames), '', '', ''])

      // Row 12: KILLS
      csv += row(['', ...bStatRow('kills'), '', 'KILLS', '', ...rev(rStatRow('kills')), '', '', ''])

      // Row 13: DEATHS
      csv += row(['', ...bStatRow('deaths'), '', 'DEATHS', '', ...rev(rStatRow('deaths')), '', '', ''])

      // Row 14: ASSISTS
      csv += row(['', ...bStatRow('assists'), '', 'ASSISTS', '', ...rev(rStatRow('assists')), '', '', ''])

      // Row 15: GOLD
      csv += row(['', ...bStatRow('gold'), '', 'GOLD', '', ...rev(rStatRow('gold')), '', '', ''])

      // Row 16: RATING
      csv += row(['', ...bStatRow('rating'), '', 'RATING', '', ...rev(rStatRow('rating')), '', '', ''])

      // Row 17: DAMAGE
      csv += row(['', ...bStatRow('damage_dealt'), '', 'DAMAGE', '', ...rev(rStatRow('damage_dealt')), '', '', ''])

      // Row 18: TURRET
      csv += row(['', ...bStatRow('turret_damage'), '', 'TURRET', '', ...rev(rStatRow('turret_damage')), '', '', ''])

      // Row 19: DAMAGE TAKEN
      csv += row([
        '',
        ...bStatRow('damage_taken'),
        '',
        'DAMAGE TAKEN',
        '',
        ...rev(rStatRow('damage_taken')),
        '',
        '',
        '',
      ])

      // Row 20: TEAMFIGHT
      csv += row(['', ...bStatRow('teamfight'), '', 'TEAMFIGHT', '', ...rev(rStatRow('teamfight')), '', '', ''])

      // Row 21: TURTLES
      csv += row(['', ...bStatRow('turtle_slain'), '', 'TURTLES', '', ...rev(rStatRow('turtle_slain')), '', '', ''])

      // Row 22: LORDS
      csv += row(['', ...bStatRow('lord_slain'), '', 'LORDS', '', ...rev(rStatRow('lord_slain')), '', '', ''])

      // Rows 23-24: empty
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
      csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])

      // Row 25: MVP header
      csv += row([
        'MVP',
        'MVP IGN',
        'SCHOOL FULL NAME',
        'SCHOOL ABBREVIATION',
        'ROLE',
        'PICK',
        'KILLS',
        'DEATHS',
        'ASSISTS',
        'GOLD',
        'RATING',
        'DAMAGE',
        'TURRET',
        'DAMAGE TAKEN',
        'TEAMFIGHT',
        'TURTLES',
        'LORDS',
      ])

      // Row 26: MVP data
      csv += row([
        '',
        mvpIgn,
        mvpSchoolName,
        mvpSchoolAbbr,
        mvpRole,
        mvpPick,
        v(mvp?.kills),
        v(mvp?.deaths),
        v(mvp?.assists),
        v(mvp?.gold),
        v(mvp?.rating),
        v(mvp?.damage_dealt),
        v(mvp?.turret_damage),
        v(mvp?.damage_taken),
        v(mvp?.teamfight),
        v(mvp?.turtle_slain),
        v(mvp?.lord_slain),
      ])
    }

    // ── Return CSV ──
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="game-results-${gameId}.csv"`,
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('Error generating game results CSV:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

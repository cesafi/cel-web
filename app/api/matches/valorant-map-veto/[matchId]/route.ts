import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getMatchWeekAndDay } from '@/services/schedule-utils'

// ── CSV helpers ──
const escapeCsv = (v: any): string => {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}
const row = (vals: (string | number | null | undefined)[]): string => vals.map(escapeCsv).join(',') + '\r\n'

const N = 'None' // Filler for missing data

/**
 * Valorant Map Veto CSV export — 15-column grid (A–O)
 *
 * Layout mirrors valorant-map-veto.csv:
 *   Row 1: BLUE header / title / RED header
 *   Row 2: School abbreviations + coin toss info + best-of
 *   Row 3: School names + coin toss winner abbreviation + first pick
 *   Rows 4-5: Empty
 *   Row 6: ACTION header + action sequence
 *   Row 7: SCHOOL header + school abbreviations per action
 *   Row 8: MAP header + map names per action
 *   Row 9: SCHOOL header + side-choosing school for picks
 *   Row 10: SIDE header + side chosen for picks
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId: matchIdStr } = await params
    const matchId = parseInt(matchIdStr, 10)
    if (isNaN(matchId)) return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 })

    const supabase = await getSupabaseServer()

    // ── 1. Match + participants + season ──
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(
        `
                id, best_of, coin_toss_winner_id, coin_toss_result, stage_id, scheduled_at,
                match_participants(id, team_id, match_score, team:schools_teams(id, name, school:schools(abbreviation, name))),
                esports_seasons_stages(season_id)
            `,
      )
      .eq('id', matchId)
      .single()

    if (matchError || !match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

    const seasonId = (match as any).esports_seasons_stages?.season_id
    const scheduledAt = match.scheduled_at || null
    let matchWeekAndDay = 'None'
    if (seasonId) {
      matchWeekAndDay = await getMatchWeekAndDay(match.id, seasonId, scheduledAt)
    }

    // ── 2. Teams ──
    const parts = match.match_participants || []
    const teams = parts
      .map((p: any) => {
        if (!p.team) return null
        const school = Array.isArray(p.team.school) ? p.team.school[0] : p.team.school
        return { id: p.team.id, name: p.team.name, abbr: school?.abbreviation || N, schoolName: school?.name || N }
      })
      .filter(Boolean) as { id: string; name: string; abbr: string; schoolName: string }[]

    const t1 = teams[0] ?? null
    const t2 = teams[1] ?? null

    // Determine blue/red (team1 = blue, team2 = red for the CSV layout)
    const blueAbbr = t1?.abbr || N
    const redAbbr = t2?.abbr || N
    const blueName = t1?.schoolName || N
    const redName = t2?.schoolName || N

    const bestOf = match.best_of || 3
    const coinTossWinnerId = match.coin_toss_winner_id
    const coinTossWinnerAbbr = coinTossWinnerId ? teams.find((t) => t.id === coinTossWinnerId)?.abbr || N : N

    // ── 3. Vetoes ──
    const { data: vetoes } = await supabase
      .from('valorant_map_vetoes')
      .select('*, schools_teams:team_id(id, name, school:schools(abbreviation, name))')
      .eq('match_id', matchId)
      .order('sequence_order', { ascending: true })

    const vetoList = (vetoes || []) as any[]

    // Determine first pick team
    const firstPick = vetoList.find((v: any) => v.action === 'pick')
    const firstPickAbbr = firstPick
      ? (() => {
          const school = Array.isArray(firstPick.schools_teams?.school)
            ? firstPick.schools_teams.school[0]
            : firstPick.schools_teams?.school
          return school?.abbreviation || N
        })()
      : N

    // ── 4. Map statistics (season-scoped) ──
    let mapStatsMap: Record<string, { pickRate: number; banRate: number }> = {}
    let blueWrMap: Record<string, string> = {}
    let redWrMap: Record<string, string> = {}

    // Fetch map stats from materialized view
    if (seasonId) {
      let mapQuery = supabase.from('mv_valorant_map_stats' as any).select('*')
      mapQuery = mapQuery.eq('season_id', seasonId)
      const { data: mapRows } = await mapQuery

      if (mapRows && (mapRows as any[]).length > 0) {
        // Aggregate across stages for this season
        const aggMap = new Map<string, { picks: number; bans: number; games: number }>()
        let totalGames = 0
        for (const r of mapRows as any[]) {
          const name = r.map_name
          const existing = aggMap.get(name)
          if (existing) {
            existing.picks += r.total_picks || 0
            existing.bans += r.total_bans || 0
            existing.games += r.total_games || 0
          } else {
            aggMap.set(name, { picks: r.total_picks || 0, bans: r.total_bans || 0, games: r.total_games || 0 })
          }
          totalGames += r.total_games || 0
        }
        for (const [name, stats] of aggMap.entries()) {
          mapStatsMap[name] = {
            pickRate: totalGames > 0 ? (stats.games / totalGames) * 100 : 0,
            banRate: totalGames > 0 ? (stats.bans / totalGames) * 100 : 0,
          }
        }
      }

      // Fetch per-team win rates on each map for this season
      // Get all games in this season with their maps and winners
      if (t1 && t2) {
        const { data: seasonGames } = await supabase
          .from('games')
          .select(
            `
                        id, valorant_map_id, winner_team_id,
                        valorant_maps(name),
                        matches!inner(stage_id, esports_seasons_stages!inner(season_id))
                    `,
          )
          .eq('matches.esports_seasons_stages.season_id', seasonId)
          .not('winner_team_id', 'is', null)

        // Build per-team per-map W/L
        const teamMapStats: Record<string, Record<string, { wins: number; total: number }>> = {
          [t1.id]: {},
          [t2.id]: {},
        }

        for (const g of (seasonGames || []) as any[]) {
          const mapName = g.valorant_maps?.name
          if (!mapName) continue

          // Check if either team played this game
          // We need to check game_rosters or match_participants
          // Since winner_team_id tells us the winner, let's check the game's match participants
          const winnerId = g.winner_team_id

          for (const teamId of [t1.id, t2.id]) {
            if (!teamMapStats[teamId][mapName]) teamMapStats[teamId][mapName] = { wins: 0, total: 0 }
          }

          // Check if this game involved either of our teams via match_participants
          const { data: gameParts } = await supabase
            .from('match_participants')
            .select('team_id')
            .eq('match_id', g.match_id)

          const gameTeamIds = (gameParts || []).map((p: any) => p.team_id)

          for (const teamId of [t1.id, t2.id]) {
            if (gameTeamIds.includes(teamId)) {
              if (!teamMapStats[teamId][mapName]) teamMapStats[teamId][mapName] = { wins: 0, total: 0 }
              teamMapStats[teamId][mapName].total++
              if (winnerId === teamId) teamMapStats[teamId][mapName].wins++
            }
          }
        }

        // Convert to percentage strings
        for (const [mapName, stats] of Object.entries(teamMapStats[t1.id])) {
          blueWrMap[mapName] = stats.total > 0 ? `${((stats.wins / stats.total) * 100).toFixed(0)}%` : ''
        }
        for (const [mapName, stats] of Object.entries(teamMapStats[t2.id])) {
          redWrMap[mapName] = stats.total > 0 ? `${((stats.wins / stats.total) * 100).toFixed(0)}%` : ''
        }
      }
    }

    // Build veto sequence arrays (up to 7 slots for standard Valorant map pool)
    const maxSlots = 7
    const actions: string[] = []
    const schools: string[] = []
    const maps: string[] = []
    const sideSchools: string[] = []
    const sides: string[] = []
    const pickRates: string[] = []
    const banRates: string[] = []
    const blueWrs: string[] = []
    const redWrs: string[] = []

    for (let i = 0; i < maxSlots; i++) {
      const v = vetoList[i]
      if (v) {
        const school = Array.isArray(v.schools_teams?.school) ? v.schools_teams.school[0] : v.schools_teams?.school
        const teamAbbr = school?.abbreviation || N
        const mapName = v.map_name || ''

        actions.push(v.action === 'remain' ? 'REMAIN' : v.action?.toUpperCase() || N)
        schools.push(v.action === 'remain' ? '' : teamAbbr)
        maps.push(mapName.toUpperCase() || N)

        // Stats for this map
        const ms = mapStatsMap[mapName]
        pickRates.push(ms ? `${ms.pickRate.toFixed(0)}%` : '')
        banRates.push(ms ? `${ms.banRate.toFixed(0)}%` : '')
        blueWrs.push(blueWrMap[mapName] || '')
        redWrs.push(redWrMap[mapName] || '')

        // Side info only for picks and remain
        if (v.action === 'pick' || v.action === 'remain') {
          if (v.side_selected) {
            const opposingTeam = teams.find((t) => t.id !== v.team_id)
            sideSchools.push(opposingTeam?.abbr || N)
            sides.push(v.side_selected === 'attack' ? 'ATTACKING' : 'DEFENDING')
          } else {
            sideSchools.push('')
            sides.push('')
          }
        } else {
          sideSchools.push('')
          sides.push('')
        }
      } else {
        actions.push('')
        schools.push('')
        maps.push('')
        sideSchools.push('')
        sides.push('')
        pickRates.push('')
        banRates.push('')
        blueWrs.push('')
        redWrs.push('')
      }
    }

    // ═══════════════════════════════════════════
    //  BUILD CSV — 15 columns (A–O)
    // ═══════════════════════════════════════════
    let csv = ''

    // Row 1: BLUE,,,,,,,VALORANT MAP VETO,WEEK X DAY Y,,,,,RED
    csv += row(['BLUE', '', '', '', '', '', '', 'VALORANT MAP VETO', matchWeekAndDay, '', '', '', '', '', 'RED'])

    // Row 2: SCHOOL ABBREVIATION,,,,,,COIN TOSS WINNER,BO{n},SIDE CHOSEN,,,,,,SCHOOL ABBREVIATION
    csv += row([
      blueAbbr,
      '',
      '',
      '',
      '',
      '',
      'COIN TOSS WINNER',
      `BO${bestOf}`,
      'SIDE CHOSEN',
      '',
      '',
      '',
      '',
      '',
      redAbbr,
    ])

    // Row 3: SCHOOL FULL NAME,,,,,,coinTossWinnerAbbr,,FIRST PICK,,,,,,SCHOOL FULL NAME
    csv += row([blueName, '', '', '', '', '', coinTossWinnerAbbr, '', 'FIRST PICK', '', '', '', '', '', redName])

    // Rows 4-5: empty
    csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
    csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])

    // Row 6: ,,,,ACTION,action1,action2,...
    csv += row(['', '', '', '', 'ACTION', ...actions, '', ''])

    // Row 7: ,,,,SCHOOL,school1,school2,...
    csv += row(['', '', '', '', 'SCHOOL', ...schools, '', ''])

    // Row 8: ,,,,MAP,map1,map2,...
    csv += row(['', '', '', '', 'MAP', ...maps, '', ''])

    // Row 9: ,,,,SCHOOL,sideSchool1,sideSchool2,...
    csv += row(['', '', '', '', 'SCHOOL', ...sideSchools, '', ''])

    // Row 10: ,,,,SIDE,side1,side2,...
    csv += row(['', '', '', '', 'SIDE', ...sides, '', ''])

    const concats = sideSchools.map((school, i) => {
      const side = sides[i]
      return school && side ? `${school} PICKS ${side}` : ''
    })

    // Row 11: ,,,,CONCAT,sideSchool1 PICKS side1,sideSchool2 PICKSside2,...
    csv += row(['', '', '', '', 'CONCAT', ...concats, '', ''])

    // Row 12: empty separator
    csv += row(['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])

    // Row 13: ,,,,PICK RATE,pickRate1,pickRate2,...
    csv += row(['', '', '', '', 'PICK RATE', ...pickRates, '', ''])

    // Row 14: ,,,,BAN RATE,banRate1,banRate2,...
    csv += row(['', '', '', '', 'BAN RATE', ...banRates, '', ''])

    // Row 15: ,,,,{BLUE} WR%,wr1,wr2,...
    csv += row(['', '', '', '', `${blueAbbr} WR%`, ...blueWrs, '', ''])

    // Row 16: ,,,,{RED} WR%,wr1,wr2,...
    csv += row(['', '', '', '', `${redAbbr} WR%`, ...redWrs, '', ''])

    // ── Return CSV ──
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="valorant-map-veto-${matchId}.csv"`,
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('Error generating map veto CSV:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Production API: Get available filter options
 * Includes seasons, categories (with esport name), teams, players, and matches
 * Supports cascading filters via query params
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;
    const teamId = searchParams.get('teamId') || undefined;

    const supabase = await getSupabaseServer();

    // Fetch seasons
    const { data: seasons } = await supabase
      .from('seasons')
      .select('id, name, start_at, end_at')
      .order('start_at', { ascending: false });

    // Fetch categories with esport info (join through esports table for the name)
    const { data: categories } = await supabase
      .from('esports_categories')
      .select('id, division, levels, esport_id, esports(id, name, abbreviation, logo_url)')
      .order('id');

    // Fetch teams (with school info and category for filtering)
    let teamsQuery = supabase
      .from('schools_teams')
      .select(`
        id, name, esport_category_id, season_id,
        schools(id, name, abbreviation, logo_url),
        esports_categories(id, division, levels, esport_id, esports(id, name, abbreviation))
      `)
      .eq('is_active', true)
      .order('name');

    if (seasonId) {
      teamsQuery = teamsQuery.eq('season_id', seasonId);
    }

    const { data: teams } = await teamsQuery;

    // Fetch players (optionally filtered by team)
    let playersQuery = supabase
      .from('players')
      .select('id, ign, first_name, last_name, photo_url, role')
      .order('ign');

    const { data: allPlayers } = await playersQuery;

    // If a teamId is specified, get player_seasons for that team
    let teamPlayers: any[] = [];
    if (teamId) {
      const { data: playerSeasons } = await supabase
        .from('player_seasons')
        .select('player_id, players(id, ign, first_name, last_name, photo_url, role)')
        .eq('team_id', teamId);

      teamPlayers = (playerSeasons || []).map((ps: any) => ps.players).filter(Boolean);
    }

    // Fetch recent matches for match selector
    let matchesQuery = supabase
      .from('matches')
      .select(`
        id, name, status, scheduled_at, best_of, group_name,
        match_participants(
          team_id,
          match_score,
          schools_teams(id, name, schools(abbreviation, logo_url))
        ),
        esports_seasons_stages(
          id, competition_stage, season_id,
          esports_categories(id, division, levels, esports(name, abbreviation))
        )
      `)
      .order('scheduled_at', { ascending: false })
      .limit(100);

    if (seasonId) {
      matchesQuery = matchesQuery.eq('esports_seasons_stages.season_id', seasonId);
    }

    const { data: matches } = await matchesQuery;

    // Find live matches
    const liveMatches = (matches || []).filter((m: any) => m.status === 'live');

    return NextResponse.json({
      success: true,
      data: {
        seasons: seasons || [],
        categories: (categories || []).map((c: any) => ({
          id: c.id,
          division: c.division,
          levels: c.levels,
          esport_id: c.esport_id,
          esport_name: c.esports?.name || '',
          esport_abbreviation: c.esports?.abbreviation || '',
          label: `${c.esports?.abbreviation || c.esports?.name || ''} - ${c.division} ${c.levels}`,
        })),
        teams: teams || [],
        players: teamId ? teamPlayers : (allPlayers || []),
        matches: matches || [],
        live_matches: liveMatches,
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error: any) {
    console.error('Error in production filters API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

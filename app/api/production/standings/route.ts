import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Production API: Get current standings
 * Params: seasonId, stageId, categoryId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId') ? parseInt(searchParams.get('seasonId')!) : undefined;
    const stageId = searchParams.get('stageId') ? parseInt(searchParams.get('stageId')!) : undefined;
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;

    const supabase = await getSupabaseServer();

    // First, find the relevant stages
    let stagesQuery = supabase
      .from('esports_seasons_stages')
      .select(`
        id,
        competition_stage,
        stage_type,
        season_id,
        esports_categories(
          id,
          division,
          levels,
          esports(id, name, abbreviation)
        )
      `);

    if (stageId) {
      stagesQuery = stagesQuery.eq('id', stageId);
    } else {
      if (seasonId) stagesQuery = stagesQuery.eq('season_id', seasonId);
      if (categoryId) stagesQuery = stagesQuery.eq('esport_category_id', categoryId);
    }

    const { data: stages, error: stagesError } = await stagesQuery;
    if (stagesError) throw stagesError;

    if (!stages || stages.length === 0) {
      return NextResponse.json(
        { success: true, data: { stages: [], standings: {} } },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, max-age=0',
          }
        }
      );
    }

    const stageIds = stages.map(s => s.id);

    // Get matches with participants for these stages
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id, status, best_of, group_name, stage_id,
        match_participants(
          team_id,
          match_score,
          schools_teams(
            id,
            name,
            schools(id, name, abbreviation, logo_url)
          )
        )
      `)
      .in('stage_id', stageIds)
      .in('status', ['finished', 'completed']);

    if (matchesError) throw matchesError;

    // Build standings per stage
    const standingsMap: Record<number, Record<string, any>> = {};

    for (const match of (matches || [])) {
      const stageId = match.stage_id;
      if (!standingsMap[stageId]) standingsMap[stageId] = {};

      const participants = (match as any).match_participants || [];
      if (participants.length !== 2) continue;

      const [p1, p2] = participants;
      const p1Score = p1.match_score || 0;
      const p2Score = p2.match_score || 0;

      for (const p of participants) {
        const teamId = p.team_id;
        if (!standingsMap[stageId][teamId]) {
          const schoolData = Array.isArray(p.schools_teams?.schools) 
            ? p.schools_teams.schools[0] 
            : p.schools_teams?.schools;

          standingsMap[stageId][teamId] = {
            team_id: teamId,
            team_name: p.schools_teams?.name || 'Unknown',
            school_name: schoolData?.name || '',
            school_abbreviation: schoolData?.abbreviation || '',
            school_logo_url: schoolData?.logo_url || '',
            wins: 0,
            losses: 0,
            draws: 0,
            match_wins: 0,
            match_losses: 0,
            games_won: 0,
            games_lost: 0,
            points: 0,
          };
        }

        const entry = standingsMap[stageId][teamId];
        const isP1 = p.team_id === p1.team_id;
        const myScore = isP1 ? p1Score : p2Score;
        const oppScore = isP1 ? p2Score : p1Score;

        entry.games_won += myScore;
        entry.games_lost += oppScore;

        if (myScore > oppScore) {
          entry.wins++;
          entry.match_wins++;
        } else if (myScore < oppScore) {
          entry.losses++;
          entry.match_losses++;
        } else {
          entry.draws++;
        }
      }
    }

    // Format output
    const standingsResult: any[] = stages.map(stage => ({
      stage_id: stage.id,
      competition_stage: stage.competition_stage,
      stage_type: stage.stage_type,
      category: (stage as any).esports_categories,
      standings: Object.values(standingsMap[stage.id] || {}).sort((a: any, b: any) => {
        // Sort by wins desc, then by game difference
        if (b.wins !== a.wins) return b.wins - a.wins;
        const aDiff = a.games_won - a.games_lost;
        const bDiff = b.games_won - b.games_lost;
        return bDiff - aDiff;
      }),
    }));

    return NextResponse.json(
      { success: true, data: standingsResult },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  } catch (error: any) {
    console.error('Error in production standings API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

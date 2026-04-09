import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { StandingsService } from '@/services/standings';
import { vmixResponse } from '@/lib/utils/vmix-format';
import { generateProductionMatrix, matrixToCsv } from '@/lib/utils/production-matrix';
import { getActiveParams, getProductionFormat } from '@/lib/utils/active-params';

/**
 * Production API: Get current standings
 * Params: seasonId, stageId, categoryId
 */
export async function GET(request: NextRequest) {
  try {
    const params = await getActiveParams(request, 'standings');
    const seasonId = params.seasonId ? parseInt(params.seasonId as string) : undefined;
    const stageId = params.stageId ? parseInt(params.stageId as string) : undefined;
    const categoryId = params.categoryId ? parseInt(params.categoryId as string) : undefined;
    const format = getProductionFormat(request);

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
      return vmixResponse({ stages: [], standings: {} }, format, 'standings', {}, 600);
    }

    // Fetch data using StandingsService to get accurate tiebreakers and bracket structures
    const standingsResponses = await Promise.all(stages.map(async (stage) => {
        if (stage.stage_type === 'round_robin' || stage.competition_stage.toLowerCase().includes('group')) {
            const result = await StandingsService.getGroupStageStandings(stage.id);
            return result.success ? result.data : null;
        } else if (stage.stage_type === 'single_elimination' || stage.stage_type === 'double_elimination' || stage.competition_stage.toLowerCase().includes('playoff')) {
            const result = await StandingsService.getBracketStandings(stage.id);
            if (!result.success || !result.data) return null;

            // Matrix Mapping for Production Team
            const b = result.data.bracket;
            const productionSlots: Record<string, any> = {
                stage_name: result.data.stage_name,
            };

            // 1. Generate systematic keys: r[Round]_p[Position]
            for (let r = 1; r <= 6; r++) {
                for (let p = 1; p <= 16; p++) {
                    const match = b.find(m => m.round === r && m.position === p);
                    if (match || r === 1) { 
                        productionSlots[`r${r}_p${p}`] = formatBracketMatch(match);
                    }
                }
            }

            // 2. High-Level Aliases
            const findMatch = (r: number, p: number) => b.find(m => m.round === r && m.position === p);
            productionSlots.match_1 = formatBracketMatch(findMatch(1, 1)); 
            productionSlots.match_2 = formatBracketMatch(findMatch(1, 2)); 
            productionSlots.match_3 = formatBracketMatch(findMatch(1, 3)); 
            productionSlots.match_4 = formatBracketMatch(findMatch(1, 4)); 
            productionSlots.match_5 = formatBracketMatch(findMatch(2, 2)); 
            productionSlots.match_6 = formatBracketMatch(findMatch(2, 1)); 
            productionSlots.match_7 = formatBracketMatch(findMatch(3, 2)); 
            productionSlots.match_8 = formatBracketMatch(findMatch(4, 1)); 

            return {
                ...result.data,
                production_slots: productionSlots
            };
        }
        return null;
    }));

    const standingsResult = standingsResponses.filter(Boolean);

    // Special handling for Production Matrix CSV
    if (format === 'csv' && standingsResult.length > 0) {
        // If we contain a bracket stage, find the first one and return it in Matrix format
        const bracketStage = standingsResult.find(s => s && (s.competition_stage === 'playoffs' || s.competition_stage === 'elimination'));
        if (bracketStage && (bracketStage as any).bracket) {
            const matrix = generateProductionMatrix((bracketStage as any).bracket, bracketStage.stage_name);
            const csv = matrixToCsv(matrix);
            
            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="bracket_standings_${bracketStage.stage_id}.csv"`,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 's-maxage=600, stale-while-revalidate=30'
                }
            });
        }
    }

    return vmixResponse(standingsResult, format, 'standings', {}, 600);
  } catch (error: any) {
    console.error('Error in production standings API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** Helper to format bracket matches for easy vMix consumption */
function formatBracketMatch(match: any) {
    if (!match) return { status: 'TBD' };
    return {
        id: match.match_id,
        status: match.match_status,
        scheduled_at: match.scheduled_at,
        t1_name: match.team1?.team_name || 'TBD',
        t1_school: match.team1?.school_abbreviation || 'TBD',
        t1_score: match.team1?.score ?? 0,
        t1_logo: match.team1?.school_logo_url || '',
        t2_name: match.team2?.team_name || 'TBD',
        t2_school: match.team2?.school_abbreviation || 'TBD',
        t2_score: match.team2?.score ?? 0,
        t2_logo: match.team2?.school_logo_url || '',
        winner: match.winner?.team_name || 'TBD'
    };
}

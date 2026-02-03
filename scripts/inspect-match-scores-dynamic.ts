
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function inspectMatch() {
  console.log('Searching for UCMN vs USC match...');
  
  // 1. Find the match ID first
  const { data: matches } = await supabase
    .from('matches')
    .select('id, name, stage_id, match_participants(schools_teams(schools(abbreviation)))')
    .limit(100)
    .order('created_at', { ascending: false });

  let targetMatch = null;
  if (matches) {
     for (const m of matches) {
         const teams = m.match_participants?.map((p: any) => p.schools_teams?.schools?.abbreviation).join(' vs ');
         if (teams?.includes('UCMN') && teams?.includes('USC')) {
             targetMatch = m;
             break;
         }
     }
  }

  if (!targetMatch) {
      console.log('Could not find UCMN vs USC match.');
      return;
  }

  console.log(`Found Match ID: ${targetMatch.id} (Stage: ${targetMatch.stage_id})`);

  // 2. Fetch details for this specific match
  const { data: fullMatch, error } = await supabase
    .from('matches')
    .select(`
        id, 
        name, 
        match_participants (
            id,
            team_id,
            match_score,
            schools_teams (schools (abbreviation))
        ),
        games (
            id,
            game_number,
            game_scores (
                match_participant_id,
                score
            )
        )
    `)
    .eq('id', targetMatch.id)
    .single();

  if (error) { console.error('Error fetching details:', error); return; }

  // 3. Dump It
  console.log(JSON.stringify(fullMatch, null, 2));
}

inspectMatch();

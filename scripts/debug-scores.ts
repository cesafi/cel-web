
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugScores() {
  console.log('Fetching match scores...');
  const stageId = 'ab24976c-9c04-44ac-9706-538be78df6e0';

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
        id, 
        name, 
        round,
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
    .eq('stage_id', stageId)
    .limit(5);

  if (error) { console.error(error); return; }
  if (!matches) { console.log('No matches found.'); return; }

  matches.forEach(m => {
      const p1 = m.match_participants[0];
      const p2 = m.match_participants[1];
      const t1 = p1?.schools_teams?.schools?.abbreviation || 'TBD';
      const t2 = p2?.schools_teams?.schools?.abbreviation || 'TBD';

      console.log(`\nMatch: ${t1} vs ${t2} (ID: ${m.id})`);
      console.log(`Participants Match Scores: ${p1?.match_score} - ${p2?.match_score}`);
      
      if (m.games && m.games.length > 0) {
          console.log(`Games found: ${m.games.length}`);
          m.games.forEach(g => {
              console.log(`  Game ${g.game_number}:`);
              g.game_scores.forEach((gs: any) => {
                  const teamName = (gs.match_participant_id === p1?.id) ? t1 : (gs.match_participant_id === p2?.id ? t2 : 'Unknown');
                  console.log(`    ${teamName}: ${gs.score}`);
              });
          });
      } else {
          console.log('  No games recorded.');
      }
  });
}

debugScores();

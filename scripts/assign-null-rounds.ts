
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function assignNullRounds() {
  console.log('Assigning Default Round (1) to matches with NULL round...');

  // 1. Get a Playoff Stage
  const { data: stages } = await supabase
    .from('esports_seasons_stages')
    .select('*')
    .ilike('competition_stage', '%play%')
    .limit(1);

  if (!stages || stages.length === 0) {
    console.log('No playoff stages found.');
    return;
  }
  const stageId = stages[0].id;

  // 2. Get matches with NULL round
  const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('stage_id', stageId)
        .is('round', null);

  if (!matches || matches.length === 0) {
      console.log('No matches with NULL round found.');
      return;
  }

  console.log(`Found ${matches.length} matches with NULL round.`);
  console.log('Sample Match Orders:', matches.slice(0, 5).map(m => m.match_order));

  // 3. Update them to Round 1
  const { error, count } = await supabase
    .from('matches')
    .update({ round: 1 })
    .eq('stage_id', stageId)
    .is('round', null)
    .select();

  if (error) {
      console.error('Update failed:', error);
  } else {
      console.log(`Successfully updated ${matches.length} matches to Round 1.`);
  }
}

assignNullRounds();

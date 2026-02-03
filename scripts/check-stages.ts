
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkStages() {
  console.log('Checking all bracket stages...');

  const { data: stages } = await supabase
    .from('esports_seasons_stages')
    .select('id, competition_stage, stage_type')
    .or('competition_stage.ilike.%play%,competition_stage.ilike.%elim%');

  if (!stages) {
      console.log('No stages found.');
      return;
  }

  console.table(stages);

  for (const stage of stages) {
      // Check count of matches with match_order but NO round
      const { count: targetCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('stage_id', stage.id)
        .not('match_order', 'is', null) // Has order
        .is('round', null);             // Missing round

       // Check count of matches with NO match_order AND NO round
      const { count: messyCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('stage_id', stage.id)
        .is('match_order', null)
        .is('round', null);

      console.log(`Stage: ${stage.competition_stage} (${stage.id})`);
      console.log(`  - Matches needing fix (Has Order, No Round): ${targetCount}`);
      console.log(`  - Messy Matches (No Order, No Round): ${messyCount}`);
  }
}

checkStages();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function inspectRounds() {
  console.log('Inspecting Rounds...');

  // Target specific stage for Season 3 Playoffs
  const stageId = 'ab24976c-9c04-44ac-9706-538be78df6e0';
  console.log(`Checking Stage ID: ${stageId}`);

  const { data: matches, error } = await supabase
        .from('matches')
        .select('id, name, round, match_order, group_name, scheduled_at')
        .eq('stage_id', stageId)
        .order('scheduled_at');

  if (error) {
    console.error(error);
    return;
  }


  console.log(`Matches count: ${matches.length}`);
  
  // Sort by match_order
  const orderedMatches = matches.sort((a, b) => (a.match_order || 0) - (b.match_order || 0));

  console.log('Matches by Order:');
  orderedMatches.forEach(m => {
      console.log(`Order ${m.match_order}: ${m.name || 'Unnamed'} (Round: ${m.round})`);
  });
}

inspectRounds();

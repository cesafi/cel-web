
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function findTargetMatches() {
  const stageId = 'ab24976c-9c04-44ac-9706-538be78df6e0'; 
  console.log(`Checking Stage: ${stageId}`);

  const { data: matches } = await supabase
    .from('matches')
    .select('id, name, round, match_order, match_participants(schools_teams(schools(abbreviation)))')
    .eq('stage_id', stageId);

  if (!matches) { console.log('No matches found.'); return; }

  console.log(`Found ${matches.length} matches.`);
  matches.forEach(m => {
      const teams = m.match_participants?.map((p: any) => p.schools_teams?.schools?.abbreviation).join(' vs ');
      // console.log(`ID: ${m.id} | ${teams} | R:${m.round} | O:${m.match_order}`);
      console.log(`${m.id} : ${teams} (R${m.round} O${m.match_order})`);
  });
}

findTargetMatches();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixPlacements() {
  console.log('Fixing match placements [FORCE UPDATE]...');

  const stageId = 'ab24976c-9c04-44ac-9706-538be78df6e0';
  const { data: matches } = await supabase
    .from('matches')
    .select(`
        id, 
        name, 
        round, 
        match_order, 
        match_status,
        group_name, 
        match_participants (
            score,
            is_winner,
            schools_teams (
                schools (abbreviation)
            )
        )
    `)
    .eq('stage_id', stageId);

  if (!matches) { console.log('No matches found.'); return; }

  matches.forEach(m => {
      console.log(JSON.stringify(m, null, 2));
  });
      
      // Target 1: UCMN vs USC (Loser's bracket -> Bottom of Round 2)
      // Match key could be "UCMN vs USC" or "USC vs UCMN"
      if ((teams?.includes('UCMN') && teams?.includes('USC'))) {
          console.log(`  -> UPDATING to Round 2, Order 4`);
          const { error } = await supabase.from('matches').update({ round: 2, match_order: 4 }).eq('id', m.id);
          if (error) console.error('  Update Error:', error);
          else updates++;
      }

      // Target 2: USJ-R vs UCLM (Winner's/Top -> Top of Round 2)
      if ((teams?.includes('USJ-R') && teams?.includes('UCLM'))) {
          console.log(`  -> UPDATING to Round 2, Order 1`);
          const { error } = await supabase.from('matches').update({ round: 2, match_order: 1 }).eq('id', m.id);
          if (error) console.error('  Update Error:', error);
          else updates++;
      }
      
      // Target 3: USC vs USJ-R (Next match -> Round 3?)
      if ((teams?.includes('USC') && teams?.includes('USJ-R'))) {
           console.log(`  -> UPDATING to Round 3, Order 1`);
           const { error } = await supabase.from('matches').update({ round: 3, match_order: 1 }).eq('id', m.id);
           if (error) console.error('  Update Error:', error);
           else updates++;
      }
  }
  console.log(`Finished. Updated ${updates} matches.`);
}

fixPlacements();

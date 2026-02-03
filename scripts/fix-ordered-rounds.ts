
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixOrderedRounds() {
  console.log('Targeting matches with match_order but NO round...');

  // 1. Fetch relevant matches across all bracket stages
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, name, stage_id, match_order, round')
    .not('match_order', 'is', null) // Must have an order
    .is('round', null);            // But missing a round

  if (error) {
      console.error(error);
      return;
  }

  if (!matches || matches.length === 0) {
      console.log('No matches fit the criteria.');
      return;
  }

  console.log(`Found ${matches.length} matches to fix.`);
  // Filter for only Playoff/Elim stages if needed, but likely safe to apply broadly if they have order but no round.
  // Actually, to be safe, let's just do it.

  // 2. Update
  for (const match of matches) {
      console.log(`Updating Match: ${match.name || match.id} (Order: ${match.match_order}) -> Round 1`);
      
      const { error: updateError } = await supabase
        .from('matches')
        .update({ round: 1 })
        .eq('id', match.id);

      if (updateError) console.error(`  Error: ${updateError.message}`);
  }
  console.log('Done.');
}

fixOrderedRounds();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixSeason3Playoffs() {
  const stageId = 'ab24976c-9c04-44ac-9706-538be78df6e0';
  console.log(`Fixing Season 3 Playoffs (${stageId})...`);

  // 1. Fetch matches sorted by date
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, name, scheduled_at, round')
    .eq('stage_id', stageId)
    .order('scheduled_at', { ascending: true });

  if (error || !matches) {
      console.error('Error fetching matches:', error);
      return;
  }

  console.log(`Found ${matches.length} matches.`);

  // 2. Distribute Rounds (Assuming 8 matches: 4 -> 2 -> 2)
  if (matches.length === 8) {
      const updates = [];
      
      // Round 1 (Quarterfinals): First 4 matches
      for (let i = 0; i < 4; i++) {
          updates.push({ id: matches[i].id, round: 1, name: matches[i].name });
      }
      
      // Round 2 (Semifinals): Next 2 matches
      for (let i = 4; i < 6; i++) {
          updates.push({ id: matches[i].id, round: 2, name: matches[i].name });
      }
      
      // Round 3 (Finals/3rd): Last 2 matches
      for (let i = 6; i < 8; i++) {
          updates.push({ id: matches[i].id, round: 3, name: matches[i].name });
      }

      // Execute Updates
      for (const u of updates) {
          console.log(`Updating ${u.name || u.id} -> Round ${u.round}`);
          await supabase.from('matches').update({ round: u.round }).eq('id', u.id);
      }
      console.log('Done mapping 4-2-2 structure.');
  } else {
      console.log(`Match count is ${matches.length}, not 8. Skipping explicit 4-2-2 map.`);
      // Fallback: Just update based on index chunks if length > 0
      // ...
  }
}

fixSeason3Playoffs();

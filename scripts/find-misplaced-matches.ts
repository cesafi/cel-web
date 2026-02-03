
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);


async function findMatches() {
  console.log('Searching for matches involving USC, UCMN, UCLM...');

  // Search by partial text match on name or just list recent ones
  const { data: matches } = await supabase
    .from('matches')
    .select('id, name, round, match_order, stage_id, match_participants(schools_teams(schools(abbreviation)))')
    .order('created_at', { ascending: false })
    .limit(50); // Just grab recent ones to scan

  if (!matches) { console.log('No matches'); return; }

  matches.forEach(m => {
      const teams = m.match_participants?.map((p: any) => p.schools_teams?.schools?.abbreviation).join(' vs ');
      if (teams?.includes('USC') || teams?.includes('UCMN') || teams?.includes('UCLM') || teams?.includes('USJ-R')) {
          console.log(`[${m.id}] Stage: ${m.stage_id} | ${teams} | R: ${m.round} | O: ${m.match_order} | Name: ${m.name}`);
      }
  });
}

findMatches();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function findGlobalMatches() {
  console.log('Searching for UCMN matches globally...');

  const { data: matches } = await supabase
    .from('matches')
    .select('id, name, stage_id, round, match_order, match_participants(schools_teams(schools(abbreviation)))')
    .limit(100)
    .order('created_at', { ascending: false });

  if (!matches) return;

  matches.forEach(m => {
      const teams = m.match_participants?.map((p: any) => p.schools_teams?.schools?.abbreviation).join(' vs ');
      if (teams?.includes('UCMN') && teams?.includes('USC')) {
          console.log(`FOUND: [${m.id}] Stage: ${m.stage_id} | ${teams} | R${m.round} O${m.match_order}`);
      }
  });
}

findGlobalMatches();

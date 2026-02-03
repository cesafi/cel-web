
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function findStageID() {
  const { data: matches } = await supabase
    .from('matches')
    .select('id, name, stage_id, match_participants(schools_teams(schools(abbreviation)))')
    .order('created_at', { ascending: false })
    .limit(100);

  if (matches) {
     for (const m of matches) {
         const teams = m.match_participants?.map((p: any) => p.schools_teams?.schools?.abbreviation).join(' vs ');
         if (teams?.includes('UCMN')) {
             console.log(`FOUND UCMN MATCH: ${m.id}`);
             console.log(`STAGE ID: ${m.stage_id}`);
             return;
         }
     }
  }
}

findStageID();

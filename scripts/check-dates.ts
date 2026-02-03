
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function listDates() {
  const stageId = 'ab24976c-9c04-44ac-9706-538be78df6e0';
  const { data: matches } = await supabase
    .from('matches')
    .select('id, scheduled_at')
    .eq('stage_id', stageId)
    .order('scheduled_at');

  if (matches) {
      console.log('--- MATCH LIST ---');
      matches.forEach((m, i) => console.log(`${i+1}. ${m.scheduled_at} (${m.id})`));
      console.log('------------------');
  }
}

listDates();

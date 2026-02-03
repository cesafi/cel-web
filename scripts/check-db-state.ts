
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkState() {
  const { data: seasons } = await supabase.from('seasons').select('id, name, start_at');
  console.log('Seasons:', JSON.stringify(seasons, null, 2));

  const { data: stages } = await supabase.from('esports_seasons_stages').select('id, competition_stage, stage_type, season_id, esports_categories(esports(name))');
  console.log('Stages:', JSON.stringify(stages, null, 2));
}

checkState();

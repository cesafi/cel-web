
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSeason3Stages() {
  const seasonId = '7cbe290b-2f8c-4963-b118-4ecee10eb31a'; // From previous output
  
  const { data: stages } = await supabase
    .from('esports_seasons_stages')
    .select('*')
    .eq('esports_season_id', seasonId);

  console.table(stages);

  // Check matches for one of them
  if (stages && stages.length > 0) {
      const stageId = stages.find(s => s.competition_stage.toLowerCase().includes('play'))?.id;
      if (stageId) {
          console.log(`Checking matches for Playoffs stage: ${stageId}`);
          const { count } = await supabase
            .from('matches')
            .select('*', { count: 'exact', head: true })
            .eq('stage_id', stageId);
          console.log(`Match count: ${count}`);
      }
  }
}

checkSeason3Stages();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixBracketRounds() {
  console.log('Fixing Bracket Rounds...');

  // 1. Get all Playoff/Playin stages
  const { data: stages } = await supabase
    .from('esports_seasons_stages')
    .select('*')
    .or('competition_stage.ilike.%play%,competition_stage.ilike.%elim%');

  if (!stages || stages.length === 0) {
    console.log('No playoff stages found.');
    return;
  }

  for (const stage of stages) {
    console.log(`Processing Stage: ${stage.competition_stage} (${stage.id})`);

    // 2. Get matches for this stage, sorted by date
    const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('stage_id', stage.id)
        .order('scheduled_at', { ascending: true });

    if (!matches || matches.length === 0) {
        console.log('  No matches found.');
        continue;
    }

    // 3. Cluster by Date
    let currentRound = 1;
    let updates = 0;
    
    // Safety check: ensure scheduled_at exists
    const validMatches = matches.filter(m => m.scheduled_at);
    if (validMatches.length === 0) {
        console.log('  No matches with schedule dates.');
        continue;
    }

    let lastDate = new Date(validMatches[0].scheduled_at!);
    
    // Group 1 is the first match's cluster
    const matchUpdates = [];

    for (let i = 0; i < validMatches.length; i++) {
        const match = validMatches[i];
        const matchDate = new Date(match.scheduled_at!);
        
        // If gap > 4 days (handling weekend to weekend, usually 5-7 days gap? or Fri-Sun is same round)
        // Let's say if gap > 3 days (72 hours), it's a new round.
        const diffHours = (matchDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
        
        if (diffHours > 72) { // 3 days gap
            currentRound++;
            console.log(`  -> Gap of ${diffHours.toFixed(1)}h detected. Starting Round ${currentRound} at ${match.scheduled_at}`);
        }

        if (match.round !== currentRound) {
            matchUpdates.push({ id: match.id, round: currentRound, name: match.name });
        }
        
        lastDate = matchDate; // Update reference for next gap check (keeping it relative to previous match? Or previous cluster start?)
        // If we want clustering, we should compare to the *cluster center* or just previous sorted match.
        // Comparing to previous match works if matches in a round are dense. 
        // e.g. Sat, Sun (gap 24h) -> Same round.
        // Next Sat (gap 6 days) -> New Round.
    }

    // 4. Execute Updates
    if (matchUpdates.length > 0) {
        console.log(`  Updating ${matchUpdates.length} matches with inferred rounds...`);
        for (const update of matchUpdates) {
            const { error } = await supabase
                .from('matches')
                .update({ round: update.round })
                .eq('id', update.id);
            
            if (error) console.error(`  Failed to update match ${update.id}:`, error);
            else updates++;
        }
    } else {
        console.log('  Matches already have correct rounds (or logic found no changes).');
    }
  }
  console.log('Done.');
}

fixBracketRounds();

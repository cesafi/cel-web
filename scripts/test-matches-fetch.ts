
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MatchesService } from '@/services/matches';
import { createClient } from '@supabase/supabase-js';

// Mock client extraction if needed, but MatchesService uses getClient which uses createClient
// actually MatchesService.getClient() defaults to creating a client from env vars.
// We just need to make sure env vars are LOADED.
// In this environment, we might need to manually ensure they are.

// However, let's just use the service directly if it works.
// We will call getScheduleMatches with a filter for season_id.
// And see if it returns matches from other seasons (with null relation) or filters correctly.

async function main() {
    console.log("Testing getScheduleMatches...");

    // 1. Fetch ALL matches to see what seasons exist
    const allMatches = await MatchesService.getScheduleMatches({ limit: 5 });
    if (!allMatches.success || !allMatches.data) {
        console.error("Failed to fetch initial matches:", allMatches.error);
        return;
    }
    console.log(`Fetched ${allMatches.data.matches.length} matches (sample).`);
    
    const sampleMatch = allMatches.data.matches.find(m => m.esports_seasons_stages?.season_id);
    if (!sampleMatch) {
         console.log("No matches with season_id found in sample. Cannot test season filter.");
         return;
    }

    const testSeasonId = sampleMatch.esports_seasons_stages?.season_id;
    if (!testSeasonId) {
        console.log("Season ID is null/undefined on the sample match. Skipping filter test.");
        return;
    }
    console.log(`Testing filter for Season ID: ${testSeasonId}`);

    // 2. Fetch with season filter
    const filtered = await MatchesService.getScheduleMatches({ 
        filters: { season_id: testSeasonId },
        limit: 10 
    });

    if (!filtered.success || !filtered.data) {
        console.error("Failed to fetch filtered matches:", filtered.error);
        return;
    }

    console.log(`Fetched ${filtered.data.matches.length} filtered matches.`);
    
    const invalidMatches = filtered.data.matches.filter(m => {
        // Check if relation is populated
        if (!m.esports_seasons_stages) return true; // Should not happen if filtered by it
        if (m.esports_seasons_stages.season_id !== testSeasonId) return true;
        return false;
    });

    if (invalidMatches.length > 0) {
        console.log("FAILURE: Found matches that do not match the season filter or have missing relation.");
        console.log("Invalid matches count:", invalidMatches.length);
        console.log("Sample invalid:", JSON.stringify(invalidMatches[0], null, 2));
    } else {
        console.log("SUCCESS: All matches belong to the correct season.");
    }
}

main().catch(console.error);

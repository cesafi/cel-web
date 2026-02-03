
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// --- Types for Local Parsing ---

interface OldSeries {
  id: string;
  league_schedule_id: string;
  series_type: string;
  team_a_id: string;
  team_a_score: string;
  team_a_status: string;
  team_b_id: string;
  team_b_score: string;
  team_b_status: string;
  week: string;
  platform_id: string;
  start_time: string;
  end_time: string;
  status: string;
  match_number: string;
}

interface OldLeagueSchedule {
  id: string;
  season_number: string;
  league_stage: string; // 'Groupstage', 'Play-offs', 'Play-ins'
  season_type: string; // 'Season', 'Preseason'
}

interface OldTeam {
  id: string;
  school_abbrev: string;
  team_name: string | null;
}

interface OldGamePlatform {
  id: string;
  platform_abbrev: string; // 'MLBB', 'VALO'
  platform_title: string;
}

// --- Helpers ---

function parseSqlValues(content: string, tableName: string): any[] {
  const records: any[] = [];
  // Regex to match INSERT INTO ... VALUES (...);
  // This is a simplified parser and assumes the format in the provided SQL files.
  // We'll split by "VALUES (" and then process each tuple.
  
  const valuesStart = content.indexOf('VALUES (');
  if (valuesStart === -1) return [];

  const valuesPart = content.substring(valuesStart + 7).trim();
  // Remove trailing ); or ;
  const cleanValues = valuesPart.replace(/;\s*$/, '');
  
  // Split by "), (" to handle multiple rows
  // Be careful about nested parenthesis if any (unlikely in this simple schema)
  const rows = cleanValues.split(/\),\s*\(/);

  for (const row of rows) {
    // Clean leading/trailing parens if present (first/last items)
    let cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
    
    // Split by comma, handling quoted strings
    // Basic CSV parsing logic
    const cols: string[] = [];
    let current = '';
    let inQuote = false;
    
    for (let i = 0; i < cleanRow.length; i++) {
        const char = cleanRow[i];
        if (char === "'" && (i === 0 || cleanRow[i-1] !== '\\')) {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            cols.push(cleanVal(current));
            current = '';
        } else {
            current += char;
        }
    }
    cols.push(cleanVal(current));
    records.push(cols);
  }
  return records;
}

function cleanVal(val: string): string {
    val = val.trim();
    if (val.startsWith("'") && val.endsWith("'")) {
        return val.substring(1, val.length - 1);
    }
    if (val === 'NULL') return '';
    return val;
}

// --- Main Migration Logic ---

async function migrate() {
    console.log('Starting migration...');

    // 1. Load Legacy Data
    const oldDbPath = path.join(process.cwd(), '.agent', 'old-dbs-schema');
    
    const seriesRaw = fs.readFileSync(path.join(oldDbPath, 'series_rows.sql'), 'utf-8');
    const seriesRows = parseSqlValues(seriesRaw, 'series');
    const seriesMap = new Map<string, OldSeries>();
    seriesRows.forEach(row => {
        // Mapping based on INSERT columns order in series_rows.sql:
        // "id", "league_schedule_id", "series_type", "team_a_id", "team_a_score", "team_a_status", "team_b_id", "team_b_score", "team_b_status", "week", "platform_id", "start_time", "end_time", "status", "created_at", "match_number"
        const s: OldSeries = {
            id: row[0], league_schedule_id: row[1], series_type: row[2],
            team_a_id: row[3], team_a_score: row[4], team_a_status: row[5],
            team_b_id: row[6], team_b_score: row[7], team_b_status: row[8],
            week: row[9], platform_id: row[10], start_time: row[11],
            end_time: row[12], status: row[13], match_number: row[15]
        };
        seriesMap.set(s.id, s);
    });

    const scheduleRaw = fs.readFileSync(path.join(oldDbPath, 'league_schedule_rows.sql'), 'utf-8');
    const scheduleRows = parseSqlValues(scheduleRaw, 'league_schedule');
    const scheduleMap = new Map<string, OldLeagueSchedule>();
    scheduleRows.forEach(row => {
        // "id", "start_date", "end_date", "season_number", "league_stage", "season_type", "created_at"
        const s: OldLeagueSchedule = {
            id: row[0], season_number: row[3], league_stage: row[4], season_type: row[5]
        };
        scheduleMap.set(s.id, s);
    });

    const teamsRaw = fs.readFileSync(path.join(oldDbPath, 'teams_rows.sql'), 'utf-8');
    const teamsRows = parseSqlValues(teamsRaw, 'teams');
    const teamsMap = new Map<string, OldTeam>();
    teamsRows.forEach(row => {
        // "id", "school_abbrev", "school_name", "logo_url", "created_at", "team_name"
        const t: OldTeam = {
            id: row[0], school_abbrev: row[1], team_name: row[5]
        };
        teamsMap.set(t.id, t);
    });

    const platformsRaw = fs.readFileSync(path.join(oldDbPath, 'game_platforms_rows.sql'), 'utf-8');
    const platformsRows = parseSqlValues(platformsRaw, 'game_platforms');
    const platformsMap = new Map<string, OldGamePlatform>();
    platformsRows.forEach(row => {
        // "id", "created_at", "platform_title", "platform_abbrev", "logo_url"
        const p: OldGamePlatform = {
            id: row[0], platform_title: row[2], platform_abbrev: row[3]
        };
        platformsMap.set(p.id, p);
    });

    console.log(`Loaded ${seriesMap.size} series, ${scheduleMap.size} schedules, ${teamsMap.size} teams, ${platformsMap.size} platforms.`);

    // 2. Fetch Current Data (Matches to fix)
    const { data: migratedMatches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .ilike('description', '%Migrated from old series%');

    if (matchesError) throw matchesError;
    console.log(`Found ${migratedMatches.length} migrated matches to process.`);

    // Fetch Reference Data
    const { data: seasons } = await supabase.from('seasons').select('id, name');
    const { data: esports } = await supabase.from('esports').select('id, name, abbreviation');
    const { data: stages } = await supabase
        .from('esports_seasons_stages')
        .select(`
            id, 
            competition_stage, 
            stage_type, 
            season_id, 
            esport_category_id,
            esports_categories (
                id,
                esport_id
            )
        `);

    if (!seasons || !esports || !stages) throw new Error("Failed to fetch reference data");

    // 3. Logic & Grouping Pre-calc
    // We need to group matches by (Season, Esport, StageType='Groupstage') to infer groups.
    // Map key: `${seasonName}_${esportName}`
    const groupStageMatchesByContext = new Map<string, { matchId: number, teamA: string, teamB: string }[]>();

    // Helper to find Stage ID
    const findStageId = (seasonName: string, esportName: string, leagueStage: string): number | null => {
        const season = seasons.find(s => s.name?.toLowerCase() === seasonName.toLowerCase());
        if (!season) {
             // console.warn(`Season not found: ${seasonName}`); 
             return null; 
        }

        const esport = esports.find(e => {
            const eName = e.name.toLowerCase();
            const target = esportName.toLowerCase();
            return eName.includes(target) || target.includes(eName) || e.abbreviation?.toLowerCase() === target.toLowerCase();
        });
        if (!esport) {
            // console.warn(`Esport not found: ${esportName}`); 
            return null; 
        }

        // Map Old League Stage -> New Competition Stage
        // Old: 'Groupstage', 'Play-offs', 'Play-ins'
        // New competition_stage is textual.
        const stageTarget = leagueStage.toLowerCase().replace('groupstage', 'group_stage').replace('play-offs', 'playoffs').replace('play-ins', 'playins');
        
        const stage = stages.find(s => 
            s.season_id === season.id &&
            // @ts-ignore
            s.esports_categories?.esport_id === esport.id &&
            s.competition_stage.toLowerCase().includes(stageTarget.replace('group_stage', 'group')) // 'group_stage' vs 'group devision' etc matches loosely
        );

        // Fallback for Group Stage if exact match fails (common issue with naming variations)
        if (!stage && leagueStage === 'Groupstage') {
             const anyGroupStage = stages.find(s => 
                s.season_id === season.id &&
                // @ts-ignore
                s.esports_categories?.esport_id === esport.id &&
                (s.competition_stage.toLowerCase().includes('group') || s.stage_type === 'round_robin')
            );
            return anyGroupStage?.id || null;
        }
        
         if (!stage) {
            // console.warn(`Stage not found for: ${seasonName}, ${esportName}, ${leagueStage}`);
            // Try to find ANY stage for this season/esport if play-offs
             const anyStage = stages.find(s => 
                s.season_id === season.id &&
                // @ts-ignore
                s.esports_categories?.esport_id === esport.id
            );
            if (anyStage) return anyStage.id; // Desperate fallback
            return null;
        }

        return stage.id;
    };


    const updates: any[] = [];

    for (const match of migratedMatches) {
        // Extract Old ID
        const matchDesc = match.description || '';
        const idMatch = matchDesc.match(/Migrated from old series ([a-f0-9-]+)/);
        if (!idMatch) continue;
        
        const oldId = idMatch[1];
        const oldSeries = seriesMap.get(oldId);
        if (!oldSeries) continue;

        const schedule = scheduleMap.get(oldSeries.league_schedule_id);
        const platform = platformsMap.get(oldSeries.platform_id);
        const teamA = teamsMap.get(oldSeries.team_a_id);
        const teamB = teamsMap.get(oldSeries.team_b_id);

        if (!schedule || !platform || !teamA || !teamB) continue;

        // Construct Season Name: "Season 3" / "Preseason 3"
        const seasonName = `${schedule.season_type} ${schedule.season_number}`;
        const esportName = platform.platform_title; // "Mobile Legends: Bang Bang" or "VALORANT"

        // Correct Stage
        const newStageId = findStageId(seasonName, esportName.includes('Mobile') ? 'Mobile Legends' : 'Valorant', schedule.league_stage);

        // Format Description & Name
        // i.e., CIT-U (2) vs (0) UCMN - VALORANT Week 4
        const scoreA = oldSeries.team_a_score;
        const scoreB = oldSeries.team_b_score;
        const abbrA = teamA.school_abbrev;
        const abbrB = teamB.school_abbrev;
        const week = oldSeries.week;
        const esportAbbr = platform.platform_abbrev;

        const newName = `${abbrA} vs ${abbrB}`;
        const newDesc = `${abbrA} (${scoreA}) vs (${scoreB}) ${abbrB} - ${esportAbbr} Week ${week}`;

        // Venue
        let venue = match.venue;
        if (seasonName === 'Preseason 3') venue = 'Online';
        if (seasonName === 'Season 3') venue = 'CIT-U CASE Room';

        // Match Order / Round
        const matchNumber = parseInt(oldSeries.match_number || '0');
        const matchOrder = matchNumber > 0 ? matchNumber : null;
        // If Play-offs and matchNumber > 0, use it as round? Or generic match order?
        // User said: "if its 0 then its a round robin", implying > 0 is bracket.
        // We'll map match_number to match_order.

        const updatePayload: any = {
            id: match.id,
            name: newName,
            description: newDesc,
            venue: venue,
            match_order: matchOrder,
            // If we found a stage, update it. If not, keep old (likely wrong but safe) or leave as is?
            // Better to update if found.
        };
        if (newStageId) updatePayload.stage_id = newStageId;

        // Collect for Group Inference
        if (schedule.league_stage === 'Groupstage' && matchNumber === 0) {
            const contextKey = `${seasonName}_${esportName}`;
            if (!groupStageMatchesByContext.has(contextKey)) {
                groupStageMatchesByContext.set(contextKey, []);
            }
            groupStageMatchesByContext.get(contextKey)!.push({
                matchId: match.id,
                teamA: teamA.school_abbrev, // Using Abbr as ID for graph is safer visually, usually distinct
                teamB: teamB.school_abbrev
            });
        }

        updates.push(updatePayload);
    }

    // 4. Infer Groups using Connected Components
    const matchGroupMap = new Map<number, string>();

    for (const [context, matches] of groupStageMatchesByContext.entries()) {
        const adj = new Map<string, string[]>();
        const allTeams = new Set<string>();

        // Build Graph
        for (const m of matches) {
            allTeams.add(m.teamA);
            allTeams.add(m.teamB);
            if (!adj.has(m.teamA)) adj.set(m.teamA, []);
            if (!adj.has(m.teamB)) adj.set(m.teamB, []);
            adj.get(m.teamA)!.push(m.teamB);
            adj.get(m.teamB)!.push(m.teamA);
        }

        // Find Connected Components
        const visited = new Set<string>();
        const components: string[][] = [];

        for (const team of allTeams) {
            if (!visited.has(team)) {
                const component: string[] = [];
                const queue = [team];
                visited.add(team);

                while (queue.length > 0) {
                    const curr = queue.pop()!;
                    component.push(curr);
                    const neighbors = adj.get(curr) || [];
                    for (const n of neighbors) {
                        if (!visited.has(n)) {
                            visited.add(n);
                            queue.push(n);
                        }
                    }
                }
                components.push(component);
            }
        }

        // Assign Names: Group A, Group B...
        // Sort components by size or name to be deterministic?
        // Let's sort by first team name alphabetically
        components.sort((a, b) => a[0].localeCompare(b[0]));

        components.forEach((comp, idx) => {
            const groupName = `Group ${String.fromCharCode(65 + idx)}`; // A, B, C...
            console.log(`Context [${context}]: Found ${groupName} with teams: ${comp.join(', ')}`);
            
            // Map matches involving these teams to this Group
            // Optimization: Iterate matches again
            for (const m of matches) {
                if (comp.includes(m.teamA)) {
                    matchGroupMap.set(m.matchId, groupName);
                }
            }
        });
    }

    // Apply Group Names to Updates
    for (const update of updates) {
        if (matchGroupMap.has(update.id)) {
            update.group_name = matchGroupMap.get(update.id);
        }
    }

    console.log(`Prepared ${updates.length} updates.`);

    // 5. Execute Batch Updates
    // supabase.upsert supports batch, but basic update might not?
    // We have to loop.
    let successCount = 0;
    for (const u of updates) {
        const { error } = await supabase.from('matches').update({
            stage_id: u.stage_id,
            name: u.name,
            description: u.description,
            venue: u.venue,
            match_order: u.match_order,
            group_name: u.group_name
        }).eq('id', u.id);

        if (error) {
            console.error(`Failed update for match ${u.id}:`, error);
        } else {
            successCount++;
        }
        
        // Progress log every 50
        if (successCount % 50 === 0) console.log(`Updated ${successCount}...`);
    }

    console.log(`Migration complete. Successfully updated ${successCount} matches.`);
}

migrate().catch(console.error);

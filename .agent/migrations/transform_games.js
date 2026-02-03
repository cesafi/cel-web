const fs = require('fs');
const path = require('path');

// Read the source files
const mlbbFile = path.join(__dirname, '..', 'old-dbs-schema', 'mlbb_matches_rows.sql');
const valoFile = path.join(__dirname, '..', 'old-dbs-schema', 'valorant_matches_rows.sql');
const outputFile = path.join(__dirname, 'full_migration_games.sql');

let mlbbContent = fs.readFileSync(mlbbFile, 'utf8');
let valoContent = fs.readFileSync(valoFile, 'utf8');

// Transform MLBB data for staging table
mlbbContent = mlbbContent
  .replace(/INSERT INTO "public"\."mlbb_matches"/g, 'INSERT INTO _old_mlbb_games_migration')
  .replace(/;\s*$/, '');

// Transform Valorant data for staging table
valoContent = valoContent
  .replace(/INSERT INTO "public"\."valorant_matches"/g, 'INSERT INTO _old_valo_games_migration')
  .replace(/;\s*$/, '');

const header = `-- Full Games Migration Script
-- Run this entire script at once in Supabase SQL Editor
-- Run AFTER matches are migrated (full_migration_matches.sql)

-- ============================================================================
-- Step 1: Create staging tables for old game data
-- ============================================================================
DROP TABLE IF EXISTS _old_mlbb_games_migration;
DROP TABLE IF EXISTS _old_valo_games_migration;
DROP TABLE IF EXISTS _migration_mlbb_games;
DROP TABLE IF EXISTS _migration_valo_games;

-- MLBB staging table
CREATE TABLE _old_mlbb_games_migration (
  id UUID PRIMARY KEY,
  series_id UUID,
  match_duration TEXT,
  team_a_status TEXT,
  team_b_status TEXT,
  match_number INTEGER,
  created_at TIMESTAMPTZ
);

-- Valorant staging table
CREATE TABLE _old_valo_games_migration (
  id UUID PRIMARY KEY,
  series_id UUID,
  map_id UUID,
  match_duration TEXT,
  match_number INTEGER,
  team_a_status TEXT,
  team_a_rounds INTEGER,
  team_b_status TEXT,
  team_b_rounds INTEGER,
  created_at TIMESTAMPTZ
);

-- Mapping tables
CREATE TABLE _migration_mlbb_games (
  old_game_id UUID PRIMARY KEY,
  old_series_id UUID,
  new_game_id INTEGER,
  team_a_status TEXT,
  team_b_status TEXT
);

CREATE TABLE _migration_valo_games (
  old_game_id UUID PRIMARY KEY,
  old_series_id UUID,
  new_game_id INTEGER,
  team_a_rounds INTEGER,
  team_b_rounds INTEGER
);

-- ============================================================================
-- Step 2: Insert MLBB game data
-- ============================================================================
`;

const midSection = `
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Step 3: Insert Valorant game data
-- ============================================================================
`;

const footer = `
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Step 4: Migrate MLBB games to games table
-- ============================================================================
DO $$
DECLARE
  game_record RECORD;
  new_game_id INTEGER;
  new_match_id INTEGER;
BEGIN
  FOR game_record IN 
    SELECT * FROM _old_mlbb_games_migration
    ORDER BY series_id, match_number
  LOOP
    -- Get the new match_id from our mapping table
    SELECT m.new_match_id INTO new_match_id
    FROM _migration_series_to_matches m
    WHERE m.old_series_id = game_record.series_id;
    
    IF new_match_id IS NOT NULL THEN
      INSERT INTO games (
        match_id,
        game_number,
        duration,
        valorant_map_id,
        created_at,
        updated_at
      )
      VALUES (
        new_match_id,
        game_record.match_number,
        game_record.match_duration::interval,
        NULL, -- MLBB doesn't have maps
        game_record.created_at,
        NOW()
      )
      RETURNING id INTO new_game_id;
      
      -- Track the mapping with team status for game_scores
      INSERT INTO _migration_mlbb_games (old_game_id, old_series_id, new_game_id, team_a_status, team_b_status)
      VALUES (game_record.id, game_record.series_id, new_game_id, game_record.team_a_status, game_record.team_b_status);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Step 5: Migrate Valorant games to games table
-- ============================================================================
DO $$
DECLARE
  game_record RECORD;
  new_game_id INTEGER;
  new_match_id INTEGER;
  map_id_val INTEGER;
BEGIN
  FOR game_record IN 
    SELECT * FROM _old_valo_games_migration
    ORDER BY series_id, match_number
  LOOP
    -- Get the new match_id from our mapping table
    SELECT m.new_match_id INTO new_match_id
    FROM _migration_series_to_matches m
    WHERE m.old_series_id = game_record.series_id;
    
    -- Map old map_id UUID to new valorant_maps.id
    SELECT vm.id INTO map_id_val
    FROM valorant_maps vm
    WHERE vm.name = CASE game_record.map_id
      WHEN '6f7dafd3-8314-4b31-be28-64af5c874405' THEN 'Ascent'
      WHEN '850c09b9-53ef-4dc9-a68b-1cdde3344d0e' THEN 'Haven'
      WHEN 'df0aa279-5978-4880-9aba-bcce0f47bc1c' THEN 'Icebox'
      WHEN 'a4a59961-2e1f-4215-8a23-95d4dcba0af0' THEN 'Bind'
      WHEN '11cb7121-09ab-432f-9990-a9b7af4a2f99' THEN 'Split'
      WHEN 'e90d9ba5-81f4-464a-b5ba-31b6a598bd8b' THEN 'Breeze'
      WHEN '6ae4304a-6d71-4973-9162-1af96529e06d' THEN 'Pearl'
      WHEN '58707bba-8426-4b40-b7b4-796d3ad75021' THEN 'Lotus'
      WHEN 'dc54e13f-a71c-47e9-971e-56df4658655d' THEN 'Fracture'
      ELSE NULL
    END;
    
    IF new_match_id IS NOT NULL THEN
      INSERT INTO games (
        match_id,
        game_number,
        duration,
        valorant_map_id,
        created_at,
        updated_at
      )
      VALUES (
        new_match_id,
        game_record.match_number,
        game_record.match_duration::interval,
        map_id_val,
        game_record.created_at,
        NOW()
      )
      RETURNING id INTO new_game_id;
      
      -- Track the mapping with round scores for game_scores
      INSERT INTO _migration_valo_games (old_game_id, old_series_id, new_game_id, team_a_rounds, team_b_rounds)
      VALUES (game_record.id, game_record.series_id, new_game_id, game_record.team_a_rounds, game_record.team_b_rounds);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Step 6: Create game_scores for MLBB games
-- ============================================================================
DO $$
DECLARE
  game_record RECORD;
  participant_a_id INTEGER;
  participant_b_id INTEGER;
  team_a_score INTEGER;
  team_b_score INTEGER;
BEGIN
  FOR game_record IN 
    SELECT 
      mg.new_game_id,
      mg.old_series_id,
      mg.team_a_status,
      mg.team_b_status,
      os.team_a_id,
      os.team_b_id,
      os.platform_id
    FROM _migration_mlbb_games mg
    JOIN _old_series_migration os ON os.id = mg.old_series_id
  LOOP
    -- For MLBB: Win=1, Loss=0, Draw=0
    team_a_score := CASE game_record.team_a_status WHEN 'Win' THEN 1 ELSE 0 END;
    team_b_score := CASE game_record.team_b_status WHEN 'Win' THEN 1 ELSE 0 END;
    
    -- Get match participant for Team A
    SELECT mp.id INTO participant_a_id
    FROM match_participants mp
    JOIN games g ON g.match_id = mp.match_id
    JOIN schools_teams st ON st.id = mp.team_id
    WHERE g.id = game_record.new_game_id
      AND st.school_id = game_record.team_a_id
      AND st.esport_category_id = 1 -- MLBB
    LIMIT 1;
    
    -- Get match participant for Team B
    SELECT mp.id INTO participant_b_id
    FROM match_participants mp
    JOIN games g ON g.match_id = mp.match_id
    JOIN schools_teams st ON st.id = mp.team_id
    WHERE g.id = game_record.new_game_id
      AND st.school_id = game_record.team_b_id
      AND st.esport_category_id = 1 -- MLBB
    LIMIT 1;
    
    -- Insert scores
    IF participant_a_id IS NOT NULL THEN
      INSERT INTO game_scores (game_id, match_participant_id, score, created_at, updated_at)
      VALUES (game_record.new_game_id, participant_a_id, team_a_score, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF participant_b_id IS NOT NULL THEN
      INSERT INTO game_scores (game_id, match_participant_id, score, created_at, updated_at)
      VALUES (game_record.new_game_id, participant_b_id, team_b_score, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Step 7: Create game_scores for Valorant games
-- ============================================================================
DO $$
DECLARE
  game_record RECORD;
  participant_a_id INTEGER;
  participant_b_id INTEGER;
BEGIN
  FOR game_record IN 
    SELECT 
      vg.new_game_id,
      vg.old_series_id,
      vg.team_a_rounds,
      vg.team_b_rounds,
      os.team_a_id,
      os.team_b_id,
      os.platform_id
    FROM _migration_valo_games vg
    JOIN _old_series_migration os ON os.id = vg.old_series_id
  LOOP
    -- Get match participant for Team A
    SELECT mp.id INTO participant_a_id
    FROM match_participants mp
    JOIN games g ON g.match_id = mp.match_id
    JOIN schools_teams st ON st.id = mp.team_id
    WHERE g.id = game_record.new_game_id
      AND st.school_id = game_record.team_a_id
      AND st.esport_category_id = 2 -- Valorant
    LIMIT 1;
    
    -- Get match participant for Team B
    SELECT mp.id INTO participant_b_id
    FROM match_participants mp
    JOIN games g ON g.match_id = mp.match_id
    JOIN schools_teams st ON st.id = mp.team_id
    WHERE g.id = game_record.new_game_id
      AND st.school_id = game_record.team_b_id
      AND st.esport_category_id = 2 -- Valorant
    LIMIT 1;
    
    -- Insert scores (rounds for Valorant)
    IF participant_a_id IS NOT NULL THEN
      INSERT INTO game_scores (game_id, match_participant_id, score, created_at, updated_at)
      VALUES (game_record.new_game_id, participant_a_id, game_record.team_a_rounds, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF participant_b_id IS NOT NULL THEN
      INSERT INTO game_scores (game_id, match_participant_id, score, created_at, updated_at)
      VALUES (game_record.new_game_id, participant_b_id, game_record.team_b_rounds, NOW(), NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Step 8: Verification
-- ============================================================================
SELECT 'Games migrated:' as info, COUNT(*) as count FROM games;
SELECT 'Game scores created:' as info, COUNT(*) as count FROM game_scores;

-- Sample verification
SELECT 
  g.id as game_id,
  m.name as match_name,
  g.game_number,
  g.duration,
  vm.name as map_name,
  e.abbreviation as esport
FROM games g
JOIN matches m ON m.id = g.match_id
JOIN esports_seasons_stages ess ON ess.id = m.stage_id
JOIN esports_categories ec ON ec.id = ess.esport_category_id
JOIN esports e ON e.id = ec.esport_id
LEFT JOIN valorant_maps vm ON vm.id = g.valorant_map_id
ORDER BY g.created_at DESC
LIMIT 10;

-- ============================================================================
-- Cleanup (optional - uncomment after verifying)
-- ============================================================================
-- DROP TABLE IF EXISTS _migration_mlbb_games;
-- DROP TABLE IF EXISTS _migration_valo_games;
-- DROP TABLE IF EXISTS _old_mlbb_games_migration;
-- DROP TABLE IF EXISTS _old_valo_games_migration;
`;

// Write the full migration file
fs.writeFileSync(outputFile, header + mlbbContent + midSection + valoContent + footer);
console.log('Done! Created full_migration_games.sql');

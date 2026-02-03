const fs = require('fs');
const path = require('path');

// Read the source files
const mlbbStatsFile = path.join(__dirname, '..', 'old-dbs-schema', 'mlbb_matches_player_stats_rows.sql');
const valoStatsFile = path.join(__dirname, '..', 'old-dbs-schema', 'valorant_matches_player_stats_rows.sql');
const outputFile = path.join(__dirname, 'full_migration_player_stats.sql');

let mlbbContent = fs.readFileSync(mlbbStatsFile, 'utf8');
let valoContent = fs.readFileSync(valoStatsFile, 'utf8');

// Transform MLBB stats data for staging table
mlbbContent = mlbbContent
  .replace(/INSERT INTO "public"\."mlbb_matches_player_stats"/g, 'INSERT INTO _old_mlbb_player_stats_migration')
  .replace(/;\\s*$/, '');

// Transform Valorant stats data for staging table
valoContent = valoContent
  .replace(/INSERT INTO "public"\."valorant_matches_player_stats"/g, 'INSERT INTO _old_valo_player_stats_migration')
  .replace(/;\\s*$/, '');

const header = `-- Full Player Stats Migration Script
-- Run this entire script at once in Supabase SQL Editor
-- Run AFTER games are migrated (full_migration_games.sql) and players exist
-- IMPORTANT: First run create_player_stats_tables.sql to create the target tables

-- ============================================================================
-- Step 1: Create staging tables for old player stats data
-- ============================================================================
DROP TABLE IF EXISTS _old_mlbb_player_stats_migration;
DROP TABLE IF EXISTS _old_valo_player_stats_migration;

-- MLBB player stats staging table
CREATE TABLE _old_mlbb_player_stats_migration (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  player_id UUID,
  match_id UUID,  -- References old mlbb_matches
  hero_id UUID,   -- References old game_characters
  rating TEXT,
  is_mvp TEXT,
  kills TEXT,
  deaths TEXT,
  assists TEXT,
  net_worth TEXT,
  hero_dmg TEXT,
  turret_dmg TEXT,
  dmg_tkn TEXT,
  teamfight TEXT,
  turtle_slain TEXT,
  lord_slain TEXT
);

-- Valorant player stats staging table  
CREATE TABLE _old_valo_player_stats_migration (
  id UUID PRIMARY KEY,
  player_id UUID,
  match_id UUID,    -- References old valorant_matches
  agent_id UUID,    -- References old game_characters
  acs TEXT,
  kills TEXT,
  deaths TEXT,
  assists TEXT,
  econ_rating TEXT,
  first_bloods TEXT,
  plants TEXT,
  defuses TEXT,
  is_mvp TEXT,
  created_at TIMESTAMPTZ
);

-- ============================================================================
-- Step 2: Insert original MLBB player stats data
-- ============================================================================
`;

const mlbbDataSection = `
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Step 3: Insert original Valorant player stats data
-- ============================================================================
`;

const valoDataSection = `
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Step 4: Migrate MLBB player stats to new table
-- ============================================================================

-- First, let's see which heroes we have in the old data
-- SELECT DISTINCT hero_id FROM _old_mlbb_player_stats_migration;

INSERT INTO stats_mlbb_game_player (
  player_id,
  game_id,
  team_id,
  hero_name,
  kills,
  deaths,
  assists,
  gold,
  damage_dealt,
  turret_damage,
  damage_taken,
  created_at
)
SELECT 
  ps.player_id,
  mg.new_game_id,
  p.team_id, -- Use team_id from the players table if available
  gc.name AS hero_name, -- Hero name from game_characters lookup
  ps.kills::INTEGER,
  ps.deaths::INTEGER,
  ps.assists::INTEGER,
  ps.net_worth::INTEGER,
  ps.hero_dmg::INTEGER,
  ps.turret_dmg::INTEGER,
  ps.dmg_tkn::INTEGER,
  ps.created_at
FROM _old_mlbb_player_stats_migration ps
JOIN _migration_mlbb_games mg ON mg.old_game_id = ps.match_id
LEFT JOIN players p ON p.id = ps.player_id
LEFT JOIN game_characters gc ON gc.id = ps.hero_id
WHERE NOT EXISTS (
  SELECT 1 FROM stats_mlbb_game_player smgp
  WHERE smgp.player_id = ps.player_id AND smgp.game_id = mg.new_game_id
)
ON CONFLICT (player_id, game_id) DO NOTHING;

-- ============================================================================
-- Step 5: Migrate Valorant player stats to new table
-- ============================================================================

INSERT INTO stats_valorant_game_player (
  player_id,
  game_id,
  team_id,
  agent_name,
  acs,
  kills,
  deaths,
  assists,
  first_bloods,
  created_at
)
SELECT 
  ps.player_id,
  mg.new_game_id,
  p.team_id, -- Use team_id from the players table if available
  gc.name AS agent_name, -- Agent name from game_characters lookup
  ps.acs::INTEGER,
  ps.kills::INTEGER,
  ps.deaths::INTEGER,
  ps.assists::INTEGER,
  ps.first_bloods::INTEGER,
  ps.created_at
FROM _old_valo_player_stats_migration ps
JOIN _migration_valo_games mg ON mg.old_game_id = ps.match_id
LEFT JOIN players p ON p.id = ps.player_id
LEFT JOIN game_characters gc ON gc.id = ps.agent_id
WHERE NOT EXISTS (
  SELECT 1 FROM stats_valorant_game_player svgp
  WHERE svgp.player_id = ps.player_id AND svgp.game_id = mg.new_game_id
)
ON CONFLICT (player_id, game_id) DO NOTHING;

-- ============================================================================
-- Step 6: Verification
-- ============================================================================

-- Count records
SELECT 'MLBB staging records' as type, COUNT(*) as count FROM _old_mlbb_player_stats_migration
UNION ALL
SELECT 'Valorant staging records' as type, COUNT(*) FROM _old_valo_player_stats_migration
UNION ALL
SELECT 'MLBB migrated stats' as type, COUNT(*) FROM stats_mlbb_game_player
UNION ALL
SELECT 'Valorant migrated stats' as type, COUNT(*) FROM stats_valorant_game_player;

-- Sample MLBB stats
SELECT 
  p.ign as player_name,
  smgp.hero_name,
  smgp.kills,
  smgp.deaths,
  smgp.assists,
  smgp.gold,
  smgp.damage_dealt
FROM stats_mlbb_game_player smgp
JOIN players p ON p.id = smgp.player_id
ORDER BY smgp.kills DESC
LIMIT 10;

-- Sample Valorant stats
SELECT 
  p.ign as player_name,
  svgp.agent_name,
  svgp.acs,
  svgp.kills,
  svgp.deaths,
  svgp.assists,
  svgp.first_bloods
FROM stats_valorant_game_player svgp
JOIN players p ON p.id = svgp.player_id
ORDER BY svgp.acs DESC
LIMIT 10;

-- Check for missing heroes/agents (should have game_characters populated first)
SELECT 'MLBB missing heroes' as issue, COUNT(DISTINCT hero_id) as count 
FROM _old_mlbb_player_stats_migration 
WHERE hero_id NOT IN (SELECT id FROM game_characters WHERE id IS NOT NULL)
UNION ALL
SELECT 'Valorant missing agents' as issue, COUNT(DISTINCT agent_id) as count 
FROM _old_valo_player_stats_migration 
WHERE agent_id NOT IN (SELECT id FROM game_characters WHERE id IS NOT NULL);
`;

// Combine everything
const fullScript = header + mlbbContent + mlbbDataSection + valoContent + valoDataSection;

fs.writeFileSync(outputFile, fullScript);

console.log('Done! Created full_migration_player_stats.sql');
console.log('');
console.log('Migration order:');
console.log('1. create_player_stats_tables.sql (create the target tables)');
console.log('2. full_migration_games.sql (must run first to create game mappings)');
console.log('3. full_migration_player_stats.sql (this script)');

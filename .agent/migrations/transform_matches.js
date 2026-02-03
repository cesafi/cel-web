const fs = require('fs');
const path = require('path');

// Read the source file
const sourceFile = path.join(__dirname, '..', 'old-dbs-schema', 'series_rows.sql');
const outputFile = path.join(__dirname, 'full_migration_matches.sql');
let content = fs.readFileSync(sourceFile, 'utf8');

// Transform the data for staging table
content = content
  // Change table name
  .replace(/INSERT INTO "public"\."series"/g, 'INSERT INTO _old_series_migration')
  // Remove trailing semicolon so we can add ON CONFLICT
  .replace(/;\s*$/, '');

const header = `-- Full Matches Migration Script
-- Run this entire script at once in Supabase SQL Editor
-- Run AFTER esports_seasons_stages and schools_teams are migrated

-- ============================================================================
-- Step 1: Create staging table for old series data
-- ============================================================================
DROP TABLE IF EXISTS _old_series_migration;
DROP TABLE IF EXISTS _migration_series_to_matches;

CREATE TABLE _old_series_migration (
  id UUID PRIMARY KEY,
  league_schedule_id UUID,
  series_type TEXT,
  team_a_id UUID,
  team_a_score INTEGER,
  team_a_status TEXT,
  team_b_id UUID,
  team_b_score INTEGER,
  team_b_status TEXT,
  week INTEGER,
  platform_id UUID,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status TEXT,
  created_at TIMESTAMPTZ,
  match_number INTEGER
);

-- Mapping table to track old series ID to new match ID
CREATE TABLE _migration_series_to_matches (
  old_series_id UUID PRIMARY KEY,
  new_match_id INTEGER
);

-- ============================================================================
-- Step 2: Insert old series data
-- ============================================================================
`;

const footer = `
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Step 3: Create helper function for stage mapping
-- ============================================================================
CREATE OR REPLACE FUNCTION get_stage_id(
  old_league_schedule_id UUID,
  old_platform_id UUID
) RETURNS INTEGER AS $$
BEGIN
  -- Preseason Groupstage
  IF old_league_schedule_id = 'dbe6cee3-cde1-4c50-bcbd-430908f0a296' THEN
    IF old_platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e' THEN RETURN 1; END IF;
    IF old_platform_id = '959e30c2-22f1-4a48-b56c-27c2fd2d87a1' THEN RETURN 2; END IF;
  -- Preseason Playoffs
  ELSIF old_league_schedule_id = '1b5fcebe-df50-439a-b3e2-181030a3cb90' THEN
    IF old_platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e' THEN RETURN 3; END IF;
    IF old_platform_id = '959e30c2-22f1-4a48-b56c-27c2fd2d87a1' THEN RETURN 4; END IF;
  -- Regular Season
  ELSIF old_league_schedule_id = 'eeeca5ef-5fc8-4077-937b-8db91acda6b4' THEN
    IF old_platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e' THEN RETURN 5; END IF;
    IF old_platform_id = '959e30c2-22f1-4a48-b56c-27c2fd2d87a1' THEN RETURN 6; END IF;
  -- Play-ins
  ELSIF old_league_schedule_id = 'bb9a49cb-305e-4e53-8ed6-cd8c18cd807c' THEN
    IF old_platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e' THEN RETURN 7; END IF;
    IF old_platform_id = '959e30c2-22f1-4a48-b56c-27c2fd2d87a1' THEN RETURN 8; END IF;
  -- Playoffs
  ELSIF old_league_schedule_id = '7cbe290b-2f8c-4963-b118-4ecee10eb31a' THEN
    IF old_platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e' THEN RETURN 9; END IF;
    IF old_platform_id = '959e30c2-22f1-4a48-b56c-27c2fd2d87a1' THEN RETURN 10; END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Step 4: Migrate matches from staging table
-- ============================================================================
DO $$
DECLARE
  new_id INTEGER;
  series_record RECORD;
BEGIN
  FOR series_record IN 
    SELECT * FROM _old_series_migration
    ORDER BY start_time
  LOOP
    INSERT INTO matches (
      stage_id, 
      best_of, 
      name, 
      description, 
      venue,
      scheduled_at, 
      start_at,
      end_at,
      status, 
      created_at, 
      updated_at
    )
    VALUES (
      get_stage_id(series_record.league_schedule_id, series_record.platform_id),
      CASE series_record.series_type
        WHEN 'BO1' THEN 1
        WHEN 'BO2' THEN 2
        WHEN 'BO3' THEN 3
        WHEN 'BO5' THEN 5
        ELSE 3
      END,
      'Week ' || series_record.week || ' Match',
      'Migrated from old series ' || series_record.id,
      'TBD',
      series_record.start_time,
      series_record.start_time,
      series_record.end_time,
      CASE series_record.status
        WHEN 'Finished' THEN 'completed'
        WHEN 'Ongoing' THEN 'live'
        ELSE 'scheduled'
      END::match_status,
      COALESCE(series_record.created_at, NOW()),
      NOW()
    )
    RETURNING id INTO new_id;
    
    -- Track the mapping
    INSERT INTO _migration_series_to_matches (old_series_id, new_match_id)
    VALUES (series_record.id, new_id);
  END LOOP;
END $$;

-- ============================================================================
-- Step 5: Migrate match participants
-- ============================================================================
DO $$
DECLARE
  mapping_record RECORD;
  esport_category INTEGER;
  team_a_schools_team_id UUID;
  team_b_schools_team_id UUID;
  series_record RECORD;
BEGIN
  FOR mapping_record IN 
    SELECT 
      m.old_series_id,
      m.new_match_id,
      s.team_a_id,
      s.team_a_score,
      s.team_b_id,
      s.team_b_score,
      s.platform_id
    FROM _migration_series_to_matches m
    JOIN _old_series_migration s ON s.id = m.old_series_id
  LOOP
    -- Determine esport_category based on platform
    IF mapping_record.platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e' THEN
      esport_category := 1; -- MLBB
    ELSE
      esport_category := 2; -- VALO
    END IF;
    
    -- Get schools_teams IDs for both teams (using school_id from old teams, which is now school_id)
    SELECT id INTO team_a_schools_team_id
    FROM schools_teams
    WHERE school_id = mapping_record.team_a_id
      AND esport_category_id = esport_category
    LIMIT 1;
    
    SELECT id INTO team_b_schools_team_id
    FROM schools_teams
    WHERE school_id = mapping_record.team_b_id
      AND esport_category_id = esport_category
    LIMIT 1;
    
    -- Insert Team A participant (if team found)
    IF team_a_schools_team_id IS NOT NULL THEN
      INSERT INTO match_participants (match_id, team_id, match_score, created_at, updated_at)
      VALUES (
        mapping_record.new_match_id,
        team_a_schools_team_id,
        mapping_record.team_a_score,
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Insert Team B participant (if team found)
    IF team_b_schools_team_id IS NOT NULL THEN
      INSERT INTO match_participants (match_id, team_id, match_score, created_at, updated_at)
      VALUES (
        mapping_record.new_match_id,
        team_b_schools_team_id,
        mapping_record.team_b_score,
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Step 6: Verification
-- ============================================================================
SELECT 'Matches migrated:' as info, COUNT(*) as count FROM matches;
SELECT 'Participants created:' as info, COUNT(*) as count FROM match_participants;

-- Sample verification
SELECT 
  m.id as match_id,
  ess.competition_stage,
  e.abbreviation as esport,
  m.best_of,
  m.name,
  m.scheduled_at,
  m.status
FROM matches m
JOIN esports_seasons_stages ess ON ess.id = m.stage_id
JOIN esports_categories ec ON ec.id = ess.esport_category_id
JOIN esports e ON e.id = ec.esport_id
ORDER BY m.scheduled_at DESC
LIMIT 10;

-- ============================================================================
-- Cleanup (optional - uncomment after verifying)
-- ============================================================================
-- DROP FUNCTION IF EXISTS get_stage_id(UUID, UUID);
-- DROP TABLE IF EXISTS _migration_series_to_matches;
-- DROP TABLE IF EXISTS _old_series_migration;
`;

// Write the full migration file
fs.writeFileSync(outputFile, header + content + footer);
console.log('Done! Created full_migration_matches.sql');

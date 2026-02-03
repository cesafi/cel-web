-- Migration Script: Migrate match_participants from old series team data
-- Purpose: Create match participant records linking teams to matches
-- Run AFTER matches and schools_teams are migrated

-- ============================================================================
-- MATCH_PARTICIPANTS MIGRATION
-- ============================================================================

-- Old series had:
-- team_a_id, team_a_score, team_a_status
-- team_b_id, team_b_score, team_b_status

-- New match_participants has:
-- id (int), match_id, team_id (references schools_teams), match_score

-- CHALLENGE: 
-- 1. Old team_id pointed to a single team record (not per-esport)
-- 2. New team_id must reference schools_teams which is per esport_category
-- 3. We need to find the correct schools_teams based on:
--    - The school (old team_id is now school_id in schools_teams)
--    - The esport category (determined by platform_id from series)

-- ============================================================================
-- Helper to get schools_teams.id from (school_id, esport_category_id)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_schools_team_id(
  school_id_param UUID,
  esport_category_id_param INTEGER,
  season_id_param INTEGER DEFAULT 3
) RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  SELECT id INTO result_id
  FROM schools_teams
  WHERE school_id = school_id_param
    AND esport_category_id = esport_category_id_param
    AND season_id = season_id_param
  LIMIT 1;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migrate participants using the mapping table from matches migration
-- ============================================================================

-- This requires the _migration_series_to_matches table created in 06_migrate_matches.sql

-- For each old series, create two match_participants (team A and team B)

DO $$
DECLARE
  mapping_record RECORD;
  esport_category INTEGER;
  team_a_schools_team_id UUID;
  team_b_schools_team_id UUID;
BEGIN
  -- Process each migrated match
  FOR mapping_record IN 
    SELECT 
      m.old_series_id,
      m.new_match_id,
      -- You'll need to store these during migration or re-query
      -- For now, this is a template showing the logic
      s.team_a_id,
      s.team_a_score,
      s.team_b_id,
      s.team_b_score,
      s.platform_id
    FROM _migration_series_to_matches m
    -- JOIN with old series data (or a backup of it)
    -- JOIN old_series s ON s.id = m.old_series_id
    CROSS JOIN (
      -- Placeholder - replace with actual series data
      SELECT 
        'efdc5ceb-9805-44ef-832d-e578c4e06ad8'::uuid as team_a_id,
        1 as team_a_score,
        '200be020-396c-44f4-943a-c9b69a0a255c'::uuid as team_b_id,
        1 as team_b_score,
        '959e30c2-22f1-4a48-b56c-27c2fd2d87a1'::uuid as platform_id
    ) s
    LIMIT 0 -- Remove this after setting up actual data
  LOOP
    -- Determine esport_category based on platform
    IF mapping_record.platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e' THEN
      esport_category := 1; -- MLBB
    ELSE
      esport_category := 2; -- VALO
    END IF;
    
    -- Get schools_teams IDs for both teams
    team_a_schools_team_id := get_schools_team_id(mapping_record.team_a_id, esport_category);
    team_b_schools_team_id := get_schools_team_id(mapping_record.team_b_id, esport_category);
    
    -- Insert Team A participant
    INSERT INTO match_participants (match_id, team_id, match_score, created_at, updated_at)
    VALUES (
      mapping_record.new_match_id,
      team_a_schools_team_id,
      mapping_record.team_a_score,
      NOW(),
      NOW()
    );
    
    -- Insert Team B participant
    INSERT INTO match_participants (match_id, team_id, match_score, created_at, updated_at)
    VALUES (
      mapping_record.new_match_id,
      team_b_schools_team_id,
      mapping_record.team_b_score,
      NOW(),
      NOW()
    );
  END LOOP;
END $$;

-- ============================================================================
-- ALTERNATIVE: Direct INSERT with subqueries (if you have old data accessible)
-- ============================================================================

/*
-- For each series, insert both participants
INSERT INTO match_participants (match_id, team_id, match_score, created_at, updated_at)
SELECT 
  msm.new_match_id,
  st.id,
  series.team_a_score,
  NOW(),
  NOW()
FROM old_series series
JOIN _migration_series_to_matches msm ON msm.old_series_id = series.id
JOIN schools_teams st ON st.school_id = series.team_a_id
JOIN esports_categories ec ON ec.id = st.esport_category_id
JOIN esports e ON e.id = ec.esport_id
WHERE 
  (series.platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e' AND e.abbreviation = 'MLBB')
  OR
  (series.platform_id = '959e30c2-22f1-4a48-b56c-27c2fd2d87a1' AND e.abbreviation = 'VALO');

-- Repeat for team_b...
*/

-- ============================================================================
-- Cleanup
-- ============================================================================
-- DROP FUNCTION IF EXISTS get_schools_team_id(UUID, INTEGER, INTEGER);

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  m.id as match_id,
  m.name,
  s1.abbreviation as team_a,
  mp1.match_score as team_a_score,
  s2.abbreviation as team_b,
  mp2.match_score as team_b_score
FROM matches m
JOIN match_participants mp1 ON mp1.match_id = m.id
JOIN schools_teams st1 ON st1.id = mp1.team_id
JOIN schools s1 ON s1.id = st1.school_id
JOIN match_participants mp2 ON mp2.match_id = m.id AND mp2.id > mp1.id
JOIN schools_teams st2 ON st2.id = mp2.team_id
JOIN schools s2 ON s2.id = st2.school_id
ORDER BY m.scheduled_at DESC
LIMIT 10;

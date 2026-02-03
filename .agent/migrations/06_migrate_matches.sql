-- Migration Script: Migrate matches from old series table to new matches table
-- Purpose: Create match records with participants from old series data
-- Run AFTER esports_seasons_stages and schools_teams are migrated

-- ============================================================================
-- MATCHES MIGRATION
-- ============================================================================

-- Old series table had:
-- id, league_schedule_id, series_type (BO1/BO2/BO3/BO5), team_a_id, team_a_score, 
-- team_a_status, team_b_id, team_b_score, team_b_status, week, platform_id,
-- start_time, end_time, status, created_at, match_number

-- New matches table has:
-- id (int), stage_id, best_of, name, description, venue, scheduled_at, 
-- start_at, end_at, status, stream_url, created_at, updated_at

-- Key transformations:
-- 1. series_type -> best_of (BO1=1, BO2=2, BO3=3, BO5=5)
-- 2. league_schedule_id + platform_id -> stage_id (from esports_seasons_stages)
-- 3. team scores go to match_participants table

-- ============================================================================
-- Stage ID Mapping (from 03_migrate_seasons_stages.sql)
-- ============================================================================
-- OLD league_schedule_id            | platform | NEW stage_id
-- ----------------------------------|----------|-------------
-- dbe6cee3-cde1-4c50-bcbd-430908f0a296 | MLBB  | 1
-- dbe6cee3-cde1-4c50-bcbd-430908f0a296 | VALO  | 2
-- 1b5fcebe-df50-439a-b3e2-181030a3cb90 | MLBB  | 3
-- 1b5fcebe-df50-439a-b3e2-181030a3cb90 | VALO  | 4
-- eeeca5ef-5fc8-4077-937b-8db91acda6b4 | MLBB  | 5
-- eeeca5ef-5fc8-4077-937b-8db91acda6b4 | VALO  | 6
-- bb9a49cb-305e-4e53-8ed6-cd8c18cd807c | MLBB  | 7
-- bb9a49cb-305e-4e53-8ed6-cd8c18cd807c | VALO  | 8
-- 7cbe290b-2f8c-4963-b118-4ecee10eb31a | MLBB  | 9
-- 7cbe290b-2f8c-4963-b118-4ecee10eb31a | VALO  | 10

-- Platform ID Reference:
-- MLBB: b91cc567-c7f4-4363-a01d-20f27b6af88e
-- VALO: 959e30c2-22f1-4a48-b56c-27c2fd2d87a1

-- ============================================================================
-- Creating a helper function or mapping table
-- ============================================================================

-- Create a temporary mapping function (or use CASE statements)
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
-- MIGRATE MATCHES
-- ============================================================================

-- Note: New matches table uses auto-increment INT for id, not UUID
-- We need to track the mapping from old series.id to new matches.id

-- Create a tracking/mapping table to preserve old->new ID mapping
CREATE TABLE IF NOT EXISTS _migration_series_to_matches (
  old_series_id UUID PRIMARY KEY,
  new_match_id INTEGER
);

-- Insert matches (sample - you'll need to run for all series)
-- This uses a DO block to handle the ID mapping

DO $$
DECLARE
  new_id INTEGER;
  series_record RECORD;
BEGIN
  -- Sample series entries (run for all from series_rows.sql)
  -- Example: One match from Regular Season MLBB
  
  FOR series_record IN 
    SELECT 
      '0167a304-ecb1-40e9-88e1-ef0cb83532a5'::uuid as id,
      'eeeca5ef-5fc8-4077-937b-8db91acda6b4'::uuid as league_schedule_id,
      'BO2' as series_type,
      'efdc5ceb-9805-44ef-832d-e578c4e06ad8'::uuid as team_a_id,
      1 as team_a_score,
      '200be020-396c-44f4-943a-c9b69a0a255c'::uuid as team_b_id,
      1 as team_b_score,
      3 as week,
      '959e30c2-22f1-4a48-b56c-27c2fd2d87a1'::uuid as platform_id,
      '2025-02-23 15:00:00'::timestamp as start_time,
      'Finished' as status
  LOOP
    INSERT INTO matches (
      stage_id, 
      best_of, 
      name, 
      description, 
      venue,
      scheduled_at, 
      start_at,
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
      CASE series_record.status
        WHEN 'Finished' THEN 'completed'
        WHEN 'Ongoing' THEN 'live'
        ELSE 'scheduled'
      END::match_status,
      NOW(),
      NOW()
    )
    RETURNING id INTO new_id;
    
    -- Track the mapping
    INSERT INTO _migration_series_to_matches (old_series_id, new_match_id)
    VALUES (series_record.id, new_id);
    
    -- Insert match participants (will be done in next script)
  END LOOP;
END $$;

-- ============================================================================
-- Cleanup helper function (optional, after migration)
-- ============================================================================
-- DROP FUNCTION IF EXISTS get_stage_id(UUID, UUID);
-- DROP TABLE IF EXISTS _migration_series_to_matches;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  m.id,
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
LIMIT 20;

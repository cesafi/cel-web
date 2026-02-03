-- Migration Script: Migrate games from old valorant_matches and mlbb_matches
-- Purpose: Create game records (individual rounds within a match)
-- Run AFTER matches are migrated

-- ============================================================================
-- GAMES MIGRATION
-- ============================================================================

-- Old valorant_matches had:
-- id, series_id, map_id, match_duration, match_number,
-- team_a_status, team_a_rounds, team_b_status, team_b_rounds, created_at

-- Old mlbb_matches had:
-- id, series_id, match_duration, team_a_status, team_b_status, match_number, created_at

-- New games table has:
-- id (int), match_id, game_number, duration, map_name, start_at, end_at, created_at, updated_at

-- CHALLENGE:
-- 1. Old series_id is UUID, new match_id is INTEGER
-- 2. Need to use _migration_series_to_matches to get the new match_id
-- 3. Game scores go into game_scores table (separate migration)

-- ============================================================================
-- Create mapping table for old game IDs to new game IDs
-- ============================================================================

CREATE TABLE IF NOT EXISTS _migration_valorant_games (
  old_game_id UUID PRIMARY KEY,
  old_series_id UUID,
  new_game_id INTEGER
);

CREATE TABLE IF NOT EXISTS _migration_mlbb_games (
  old_game_id UUID PRIMARY KEY,
  old_series_id UUID,
  new_game_id INTEGER
);

-- ============================================================================
-- Migrate VALORANT games
-- ============================================================================

DO $$
DECLARE
  game_record RECORD;
  new_game_id INTEGER;
  new_match_id INTEGER;
BEGIN
  -- Sample Valorant matches from old data
  -- You'll need to expand this with all valorant_matches_rows.sql entries
  
  FOR game_record IN
    SELECT 
      id,
      series_id,
      map_id,
      match_duration,
      match_number,
      created_at
    FROM (
      VALUES
        -- Sample entries (from valorant_matches_rows.sql)
        ('sample-valo-game-1'::uuid, '0167a304-ecb1-40e9-88e1-ef0cb83532a5'::uuid, NULL::uuid, '00:35:00', 1, NOW())
    ) AS old_games(id, series_id, map_id, match_duration, match_number, created_at)
    LIMIT 0 -- Remove after populating with real data
  LOOP
    -- Get the new match_id
    SELECT new_match_id INTO new_match_id
    FROM _migration_series_to_matches
    WHERE old_series_id = game_record.series_id;
    
    IF new_match_id IS NOT NULL THEN
      INSERT INTO games (
        match_id,
        game_number,
        duration,
        map_name,
        created_at,
        updated_at
      )
      VALUES (
        new_match_id,
        game_record.match_number,
        game_record.match_duration,
        -- Get map name from game_characters or a map lookup if available
        NULL, -- Will need separate map name migration
        game_record.created_at,
        NOW()
      )
      RETURNING id INTO new_game_id;
      
      -- Track the mapping
      INSERT INTO _migration_valorant_games (old_game_id, old_series_id, new_game_id)
      VALUES (game_record.id, game_record.series_id, new_game_id);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Migrate MLBB games
-- ============================================================================

DO $$
DECLARE
  game_record RECORD;
  new_game_id INTEGER;
  new_match_id INTEGER;
BEGIN
  -- Sample MLBB matches from old data
  -- You'll need to expand this with all mlbb_matches_rows.sql entries
  
  FOR game_record IN
    SELECT 
      id,
      series_id,
      match_duration,
      match_number,
      created_at
    FROM (
      VALUES
        -- Sample entries (from mlbb_matches_rows.sql)
        ('sample-mlbb-game-1'::uuid, '0167a304-ecb1-40e9-88e1-ef0cb83532a5'::uuid, '00:18:00', 1, NOW())
    ) AS old_games(id, series_id, match_duration, match_number, created_at)
    LIMIT 0 -- Remove after populating with real data
  LOOP
    -- Get the new match_id
    SELECT new_match_id INTO new_match_id
    FROM _migration_series_to_matches
    WHERE old_series_id = game_record.series_id;
    
    IF new_match_id IS NOT NULL THEN
      INSERT INTO games (
        match_id,
        game_number,
        duration,
        map_name,
        created_at,
        updated_at
      )
      VALUES (
        new_match_id,
        game_record.match_number,
        game_record.match_duration,
        NULL, -- MLBB doesn't have maps
        game_record.created_at,
        NOW()
      )
      RETURNING id INTO new_game_id;
      
      -- Track the mapping
      INSERT INTO _migration_mlbb_games (old_game_id, old_series_id, new_game_id)
      VALUES (game_record.id, game_record.series_id, new_game_id);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Migrate GAME_SCORES (round scores for each team)
-- ============================================================================

-- Old valorant_matches had team_a_rounds and team_b_rounds
-- These become game_scores entries

DO $$
DECLARE
  game_record RECORD;
  participant_a_id INTEGER;
  participant_b_id INTEGER;
BEGIN
  -- For each Valorant game, create game_scores for both teams
  FOR game_record IN
    SELECT 
      vg.old_game_id,
      vg.new_game_id,
      om.team_a_id,
      om.team_a_rounds,
      om.team_b_id,
      om.team_b_rounds
    FROM _migration_valorant_games vg
    -- JOIN with old match data to get scores
    -- JOIN old_valorant_matches om ON om.id = vg.old_game_id
    CROSS JOIN (
      SELECT 
        'efdc5ceb-9805-44ef-832d-e578c4e06ad8'::uuid as team_a_id,
        13 as team_a_rounds,
        '200be020-396c-44f4-943a-c9b69a0a255c'::uuid as team_b_id,
        8 as team_b_rounds
    ) om
    LIMIT 0 -- Remove after setting up actual data
  LOOP
    -- Get match_participant IDs
    SELECT mp.id INTO participant_a_id
    FROM match_participants mp
    JOIN games g ON g.match_id = mp.match_id
    JOIN schools_teams st ON st.id = mp.team_id
    WHERE g.id = game_record.new_game_id
      AND st.school_id = game_record.team_a_id
    LIMIT 1;
    
    SELECT mp.id INTO participant_b_id
    FROM match_participants mp
    JOIN games g ON g.match_id = mp.match_id
    JOIN schools_teams st ON st.id = mp.team_id
    WHERE g.id = game_record.new_game_id
      AND st.school_id = game_record.team_b_id
    LIMIT 1;
    
    -- Insert scores
    IF participant_a_id IS NOT NULL THEN
      INSERT INTO game_scores (game_id, match_participant_id, score, created_at, updated_at)
      VALUES (game_record.new_game_id, participant_a_id, game_record.team_a_rounds, NOW(), NOW());
    END IF;
    
    IF participant_b_id IS NOT NULL THEN
      INSERT INTO game_scores (game_id, match_participant_id, score, created_at, updated_at)
      VALUES (game_record.new_game_id, participant_b_id, game_record.team_b_rounds, NOW(), NOW());
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Cleanup
-- ============================================================================
-- DROP TABLE IF EXISTS _migration_valorant_games;
-- DROP TABLE IF EXISTS _migration_mlbb_games;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  g.id as game_id,
  m.name as match_name,
  g.game_number,
  g.duration,
  g.map_name,
  s1.abbreviation as team_a,
  gs1.score as team_a_score,
  s2.abbreviation as team_b,
  gs2.score as team_b_score
FROM games g
JOIN matches m ON m.id = g.match_id
LEFT JOIN game_scores gs1 ON gs1.game_id = g.id
LEFT JOIN match_participants mp1 ON mp1.id = gs1.match_participant_id
LEFT JOIN schools_teams st1 ON st1.id = mp1.team_id
LEFT JOIN schools s1 ON s1.id = st1.school_id
LEFT JOIN game_scores gs2 ON gs2.game_id = g.id AND gs2.id > gs1.id
LEFT JOIN match_participants mp2 ON mp2.id = gs2.match_participant_id
LEFT JOIN schools_teams st2 ON st2.id = mp2.team_id
LEFT JOIN schools s2 ON s2.id = st2.school_id
ORDER BY m.scheduled_at DESC, g.game_number
LIMIT 10;

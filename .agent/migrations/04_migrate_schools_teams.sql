-- Migration Script: Migrate schools_teams from old teams and players data
-- Purpose: Create team entries linking schools to esport categories and seasons
-- Run AFTER schools, esports_categories, and seasons are migrated

-- ============================================================================
-- SCHOOLS_TEAMS MIGRATION
-- ============================================================================

-- The old schema had teams directly tied to schools
-- In the new schema, schools_teams links: school + esport_category + season

-- We need to create teams for each school for each esport category for season 3
-- Using the old team IDs as the schools_teams IDs to maintain references

-- IMPORTANT: Verify your esport_category_id values before running:
-- Assuming: MLBB Open = 1, VALO Open = 2, season 3 = 3

-- Create team name helper (school_abbrev + team_name)
-- Example: "USC Vamos Warriors", "USC Vamos Warriors"

-- ============================================================================
-- MLBB Teams (esport_category_id = 1, assuming MLBB Open)
-- ============================================================================

-- We need to create new UUIDs for schools_teams since the same school
-- participates in multiple esports. We'll use a naming convention:
-- [old_team_id]-mlbb or [old_team_id]-valo (but UUIDs must be valid)

-- For Season 3, MLBB category (id=1)
INSERT INTO schools_teams (id, school_id, esport_category_id, season_id, name, is_active, created_at, updated_at)
VALUES
  -- BC Cheetahs - MLBB
  (gen_random_uuid(), 'bd497bb9-539e-48c0-9009-556eb7c75a0c', 1, 3, 'BC Cheetahs', true, NOW(), NOW()),
  
  -- CEC Blue Dragons - MLBB
  (gen_random_uuid(), '1fe8332b-a60b-495d-8f42-f607aab02bf9', 1, 3, 'CEC Blue Dragons', true, NOW(), NOW()),
  
  -- CIT-U Wildcats - MLBB
  (gen_random_uuid(), '200be020-396c-44f4-943a-c9b69a0a255c', 1, 3, 'CIT-U Wildcats', true, NOW(), NOW()),
  
  -- USPF Panthers - MLBB
  (gen_random_uuid(), '337fd03f-dfa5-48c7-a7ff-534a54acd5b1', 1, 3, 'USPF Panthers', true, NOW(), NOW()),
  
  -- USJ-R Jaguars - MLBB
  (gen_random_uuid(), '37148940-dbb1-4bd3-9c93-ef9e27c62840', 1, 3, 'USJ-R Jaguars', true, NOW(), NOW()),
  
  -- UPC Fighting Maroons - MLBB
  (gen_random_uuid(), '3c3c1230-2191-4544-8d1f-ebd5ee16c924', 1, 3, 'UPC Fighting Maroons', true, NOW(), NOW()),
  
  -- UCLM Webmasters - MLBB
  (gen_random_uuid(), '69612753-d51f-431c-9900-aed31c66ec55', 1, 3, 'UCLM Webmasters', true, NOW(), NOW()),
  
  -- UCMN Ronin Webmasters - MLBB
  (gen_random_uuid(), 'ccc9ffb6-ae07-4ce1-bab3-714d1d713564', 1, 3, 'UCMN Ronin Webmasters', true, NOW(), NOW()),
  
  -- USC Vamos Warriors - MLBB
  (gen_random_uuid(), 'efdc5ceb-9805-44ef-832d-e578c4e06ad8', 1, 3, 'USC Vamos Warriors', true, NOW(), NOW()),
  
  -- UV Green Lancers - MLBB
  (gen_random_uuid(), 'f1b85684-0417-4750-9a46-799f63cbc6e5', 1, 3, 'UV Green Lancers', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VALORANT Teams (esport_category_id = 2, assuming VALO Open)
-- ============================================================================

INSERT INTO schools_teams (id, school_id, esport_category_id, season_id, name, is_active, created_at, updated_at)
VALUES
  -- BC Cheetahs - VALO
  (gen_random_uuid(), 'bd497bb9-539e-48c0-9009-556eb7c75a0c', 2, 3, 'BC Cheetahs', true, NOW(), NOW()),
  
  -- CEC Blue Dragons - VALO
  (gen_random_uuid(), '1fe8332b-a60b-495d-8f42-f607aab02bf9', 2, 3, 'CEC Blue Dragons', true, NOW(), NOW()),
  
  -- CIT-U Wildcats - VALO
  (gen_random_uuid(), '200be020-396c-44f4-943a-c9b69a0a255c', 2, 3, 'CIT-U Wildcats', true, NOW(), NOW()),
  
  -- USPF Panthers - VALO
  (gen_random_uuid(), '337fd03f-dfa5-48c7-a7ff-534a54acd5b1', 2, 3, 'USPF Panthers', true, NOW(), NOW()),
  
  -- USJ-R Jaguars - VALO
  (gen_random_uuid(), '37148940-dbb1-4bd3-9c93-ef9e27c62840', 2, 3, 'USJ-R Jaguars', true, NOW(), NOW()),
  
  -- UPC Fighting Maroons - VALO
  (gen_random_uuid(), '3c3c1230-2191-4544-8d1f-ebd5ee16c924', 2, 3, 'UPC Fighting Maroons', true, NOW(), NOW()),
  
  -- UCLM Webmasters - VALO
  (gen_random_uuid(), '69612753-d51f-431c-9900-aed31c66ec55', 2, 3, 'UCLM Webmasters', true, NOW(), NOW()),
  
  -- UCMN Ronin Webmasters - VALO
  (gen_random_uuid(), 'ccc9ffb6-ae07-4ce1-bab3-714d1d713564', 2, 3, 'UCMN Ronin Webmasters', true, NOW(), NOW()),
  
  -- USC Vamos Warriors - VALO
  (gen_random_uuid(), 'efdc5ceb-9805-44ef-832d-e578c4e06ad8', 2, 3, 'USC Vamos Warriors', true, NOW(), NOW()),
  
  -- UV Green Lancers - VALO
  (gen_random_uuid(), 'f1b85684-0417-4750-9a46-799f63cbc6e5', 2, 3, 'UV Green Lancers', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ALTERNATIVE: Preserve old team IDs (if you need backward compatibility)
-- ============================================================================
-- If the old team_id is used directly as schools_teams.id:
-- This approach uses the OLD team_id (which was tied to both games)
-- You'd need to decide: use old team_id for MLBB or VALO?

-- Since old players referenced old team IDs grouped by platform_id,
-- we can map old team_id to the appropriate esport category:

-- Example: If old team_id was for MLBB players (platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e')
-- Then we use that team_id for MLBB schools_teams

-- For a cleaner migration, consider generating new IDs and creating
-- a mapping table to track old_team_id -> new_schools_teams_id

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 
  st.id, 
  s.abbreviation as school, 
  e.abbreviation as esport,
  st.name,
  st.season_id
FROM schools_teams st
JOIN schools s ON s.id = st.school_id
JOIN esports_categories ec ON ec.id = st.esport_category_id
JOIN esports e ON e.id = ec.esport_id
ORDER BY s.abbreviation, e.abbreviation;

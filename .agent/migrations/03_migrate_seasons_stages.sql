-- Migration Script: Migrate seasons and esports_seasons_stages
-- Purpose: Create seasons from old league_schedule data
-- Run AFTER schools are set up (02_migrate_schools.sql)

-- ============================================================================
-- ESPORTS SETUP (Base games/platforms)
-- ============================================================================

-- First, ensure esports records exist
INSERT INTO esports (id, name, abbreviation, logo_url, created_at, updated_at)
VALUES 
  (1, 'Mobile Legends: Bang Bang', 'MLBB', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/platforms/mlbb.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvcGxhdGZvcm1zL21sYmIud2VicCIsImlhdCI6MTczNDQwODkzOCwiZXhwIjoxNzY1OTQ0OTM4fQ.poucfEbjxmZBfG5tMe2vmxVilWcrctBHeNgBR7madHE', NOW(), NOW()),
  (2, 'VALORANT', 'VALO', 'https://uqulenyafyepinfweagp.supabase.co/storage/v1/object/sign/images/icons/platforms/VALO_1736864114119.webp?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvaWNvbnMvcGxhdGZvcm1zL1ZBTE9fMTczNjg2NDExNDExOS53ZWJwIiwiaWF0IjoxNzM2ODY0MTE1LCJleHAiOjE3Njg0MDAxMTV9.o-gSALSDVYe6106ZzFZIhYdFFl30ZGSsCkrElaNolgI', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  abbreviation = EXCLUDED.abbreviation,
  logo_url = EXCLUDED.logo_url,
  updated_at = NOW();

-- ============================================================================
-- ESPORTS CATEGORIES SETUP (Divisions within each esport)
-- ============================================================================

-- Create categories for each esport
-- Division: "Men's" or "Women's" (Women's only in Season 4)
-- Levels: "College" or "Highschool" (currently only College)

INSERT INTO esports_categories (id, esport_id, division, levels, created_at, updated_at)
VALUES
  (1, 1, 'Men''s', 'College', NOW(), NOW()),  -- MLBB Men's College
  (2, 2, 'Men''s', 'College', NOW(), NOW())   -- VALORANT Men's College
ON CONFLICT (id) DO UPDATE SET
  esport_id = EXCLUDED.esport_id,
  division = EXCLUDED.division,
  levels = EXCLUDED.levels,
  updated_at = NOW();

-- ============================================================================
-- SEASONS MIGRATION
-- ============================================================================

-- The old league_schedule contains season info
-- We need to extract unique seasons based on season_number and season_type

-- Season 1 (2022-2023)
INSERT INTO seasons (id, start_at, end_at, created_at, updated_at)
SELECT 
  1, 
  '2022-12-10',
  '2023-04-23',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE id = 1);

-- Season 2 (2023)
INSERT INTO seasons (id, start_at, end_at, created_at, updated_at)
SELECT 
  2, 
  '2023-10-07',
  '2023-11-19',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE id = 2);

-- Season 3 (2024-2025) - Current season includes Preseason and main Season
INSERT INTO seasons (id, start_at, end_at, created_at, updated_at)
SELECT 
  3, 
  '2024-06-01',
  '2025-04-26',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE id = 3);

-- ============================================================================
-- ESPORTS_SEASONS_STAGES MIGRATION
-- ============================================================================

-- Map old league_schedule to esports_seasons_stages
-- Old fields: id, start_date, end_date, season_number, league_stage, season_type

-- For each old league_schedule entry, we create stages for BOTH MLBB and Valorant
-- Since both games participate in each schedule

-- IMPORTANT: You need to know the actual esport_category_id values from your database
-- Assuming: MLBB Open = 1, VALO Open = 2

-- Season 3 Preseason Groupstage (dbe6cee3-cde1-4c50-bcbd-430908f0a296)
INSERT INTO esports_seasons_stages (id, season_id, esport_category_id, competition_stage, created_at, updated_at)
SELECT 1, 3, 1, 'Preseason Groupstage', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM esports_seasons_stages WHERE id = 1);

INSERT INTO esports_seasons_stages (id, season_id, esport_category_id, competition_stage, created_at, updated_at)
SELECT 2, 3, 2, 'Preseason Groupstage', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM esports_seasons_stages WHERE id = 2);

-- Season 3 Preseason Playoffs (1b5fcebe-df50-439a-b3e2-181030a3cb90)
INSERT INTO esports_seasons_stages (id, season_id, esport_category_id, competition_stage, created_at, updated_at)
SELECT 3, 3, 1, 'Preseason Playoffs', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM esports_seasons_stages WHERE id = 3);

INSERT INTO esports_seasons_stages (id, season_id, esport_category_id, competition_stage, created_at, updated_at)
SELECT 4, 3, 2, 'Preseason Playoffs', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM esports_seasons_stages WHERE id = 4);

-- Season 3 Main Season Groupstage (eeeca5ef-5fc8-4077-937b-8db91acda6b4)
INSERT INTO esports_seasons_stages (id, season_id, esport_category_id, competition_stage, created_at, updated_at)
SELECT 5, 3, 1, 'Regular Season', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM esports_seasons_stages WHERE id = 5);

INSERT INTO esports_seasons_stages (id, season_id, esport_category_id, competition_stage, created_at, updated_at)
SELECT 6, 3, 2, 'Regular Season', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM esports_seasons_stages WHERE id = 6);

-- Season 3 Play-ins (bb9a49cb-305e-4e53-8ed6-cd8c18cd807c)
INSERT INTO esports_seasons_stages (id, season_id, esport_category_id, competition_stage, created_at, updated_at)
SELECT 7, 3, 1, 'Play-ins', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM esports_seasons_stages WHERE id = 7);

INSERT INTO esports_seasons_stages (id, season_id, esport_category_id, competition_stage, created_at, updated_at)
SELECT 8, 3, 2, 'Play-ins', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM esports_seasons_stages WHERE id = 8);

-- Season 3 Main Season Playoffs (7cbe290b-2f8c-4963-b118-4ecee10eb31a)
INSERT INTO esports_seasons_stages (id, season_id, esport_category_id, competition_stage, created_at, updated_at)
SELECT 9, 3, 1, 'Playoffs', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM esports_seasons_stages WHERE id = 9);

INSERT INTO esports_seasons_stages (id, season_id, esport_category_id, competition_stage, created_at, updated_at)
SELECT 10, 3, 2, 'Playoffs', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM esports_seasons_stages WHERE id = 10);

-- ============================================================================
-- OLD to NEW Stage ID Mapping Reference
-- ============================================================================
-- Use this for migrating matches:
-- 
-- OLD league_schedule_id  | platform       | NEW stage_id
-- ------------------------|----------------|-------------
-- dbe6cee3-...            | MLBB           | 1
-- dbe6cee3-...            | VALO           | 2
-- 1b5fcebe-...            | MLBB           | 3
-- 1b5fcebe-...            | VALO           | 4
-- eeeca5ef-...            | MLBB           | 5
-- eeeca5ef-...            | VALO           | 6
-- bb9a49cb-...            | MLBB           | 7
-- bb9a49cb-...            | VALO           | 8
-- 7cbe290b-...            | MLBB           | 9
-- 7cbe290b-...            | VALO           | 10
-- ============================================================================

-- Verification
SELECT ess.id, s.id as season_id, ec.division, e.abbreviation, ess.competition_stage
FROM esports_seasons_stages ess
JOIN seasons s ON s.id = ess.season_id
LEFT JOIN esports_categories ec ON ec.id = ess.esport_category_id
LEFT JOIN esports e ON e.id = ec.esport_id
ORDER BY ess.id;

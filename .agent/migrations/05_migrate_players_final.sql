-- Migration Script: Migrate players - Part 2 data + migration logic
-- Run AFTER 05_migrate_players.sql creates the table and inserts first batch

-- Insert remaining players into _old_players_migration
INSERT INTO _old_players_migration VALUES
('5b0ed491-c80b-470f-a54e-9c15c2685ae1', 'Matthew Benedict', 'Golez', 'Atchoo', 'efdc5ceb-9805-44ef-832d-e578c4e06ad8', '959e30c2-22f1-4a48-b56c-27c2fd2d87a1', ARRAY['Initiator'], '', true, '2025-01-29'),
('5b849aca-bc6a-45bd-ab60-3b5c09f57cf1', 'Camilo Blu', 'Galan', 'utoy', '1fe8332b-a60b-495d-8f42-f607aab02bf9', '959e30c2-22f1-4a48-b56c-27c2fd2d87a1', ARRAY['Duelist'], '', true, '2025-01-29'),
('5db3154a-0380-4c50-bcc7-6a4ddc0597aa', 'Joshua', 'Sienes', 'Senz', '69612753-d51f-431c-9900-aed31c66ec55', 'b91cc567-c7f4-4363-a01d-20f27b6af88e', ARRAY['Gold Laner'], '', true, '2025-01-29'),
('5fbb3df2-5d87-4534-bb64-3af6e14659c2', 'Paolo', 'Bisnar', 'Apollo.', 'f1b85684-0417-4750-9a46-799f63cbc6e5', 'b91cc567-c7f4-4363-a01d-20f27b6af88e', ARRAY['Gold Laner'], '', true, '2025-01-29'),
('64da34be-ce86-4d08-b6e1-9f5bec7033cc', 'Flynt Eran', 'Tanggol', 'Fly', 'ccc9ffb6-ae07-4ce1-bab3-714d1d713564', '959e30c2-22f1-4a48-b56c-27c2fd2d87a1', ARRAY['Initiator'], '', true, '2025-01-29'),
('77bc017e-9222-46f5-8480-3057242541d0', 'Steven Mitchell', 'Mamites', 'Mallow', '37148940-dbb1-4bd3-9c93-ef9e27c62840', '959e30c2-22f1-4a48-b56c-27c2fd2d87a1', ARRAY['Initiator'], '', true, '2025-01-29'),
('810a868d-a632-4fc0-9477-fc0a9ee81dfd', 'Jhanel', 'Arranchado', 'shinobi2k', 'ccc9ffb6-ae07-4ce1-bab3-714d1d713564', '959e30c2-22f1-4a48-b56c-27c2fd2d87a1', ARRAY['Flex'], '', true, '2025-01-29'),
('b0629b60-d550-413f-ae7d-b11df8d6c8a2', 'Daniel Jon', 'Santos', 'DeeJayS', 'efdc5ceb-9805-44ef-832d-e578c4e06ad8', '959e30c2-22f1-4a48-b56c-27c2fd2d87a1', ARRAY['Sentinel'], '', true, '2025-01-29'),
('ca3600be-ad33-4f94-8028-8b2a66f85fef', 'King Clarence', 'Toston', 'kaiju', 'efdc5ceb-9805-44ef-832d-e578c4e06ad8', '959e30c2-22f1-4a48-b56c-27c2fd2d87a1', ARRAY['Duelist'], '', true, '2025-01-29'),
('db234243-539f-4c15-8f62-cdf9f570a19a', 'Tsz Yeung', 'Amora', 'aromA', 'efdc5ceb-9805-44ef-832d-e578c4e06ad8', '959e30c2-22f1-4a48-b56c-27c2fd2d87a1', ARRAY['Initiator'], '', true, '2025-01-29'),
('f95f7b68-034c-4d27-97d5-e79aa8054dff', 'Shin Mavrick', 'Formaran', 'SHIN TORU', 'efdc5ceb-9805-44ef-832d-e578c4e06ad8', 'b91cc567-c7f4-4363-a01d-20f27b6af88e', ARRAY['Gold Laner'], '', true, '2025-01-29'),
('cc86d82b-650a-40d9-8a17-ba26e4f94cbd', 'James Rey', 'Lumacang', 'Gilgamesh', 'efdc5ceb-9805-44ef-832d-e578c4e06ad8', 'b91cc567-c7f4-4363-a01d-20f27b6af88e', ARRAY['Mid Laner'], '', true, '2025-01-29'),
('f3fcd1e8-6586-4259-aff7-c2025b00ead1', 'Elian Thaddeus', 'Amores', 'Bravo', 'efdc5ceb-9805-44ef-832d-e578c4e06ad8', 'b91cc567-c7f4-4363-a01d-20f27b6af88e', ARRAY['Mid Laner'], '', true, '2025-01-29');
-- NOTE: Add remaining players from 05b and 05c files

-- ============================================================================
-- STEP 3: Migrate to actual players table
-- ============================================================================

INSERT INTO players (id, first_name, last_name, ign, team_id, photo_url, role, is_active, created_at)
SELECT 
  op.id,
  op.first_name,
  op.last_name,
  op.ingame_name,
  st.id as team_id,
  NULLIF(op.picture_url, '') as photo_url,
  COALESCE(op.roles[1], '') as role,
  op.is_active,
  op.created_at
FROM _old_players_migration op
LEFT JOIN schools_teams st ON st.school_id = op.old_team_id
LEFT JOIN esports_categories ec ON ec.id = st.esport_category_id
LEFT JOIN esports e ON e.id = ec.esport_id
WHERE 
  (op.platform_id = 'b91cc567-c7f4-4363-a01d-20f27b6af88e' AND e.abbreviation = 'MLBB')
  OR
  (op.platform_id = '959e30c2-22f1-4a48-b56c-27c2fd2d87a1' AND e.abbreviation = 'VALO')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  ign = EXCLUDED.ign,
  team_id = EXCLUDED.team_id,
  role = EXCLUDED.role;

-- Verification
SELECT COUNT(*) as migrated_players FROM players;
SELECT p.ign, s.abbreviation, e.abbreviation as esport FROM players p
LEFT JOIN schools_teams st ON st.id = p.team_id
LEFT JOIN schools s ON s.id = st.school_id
LEFT JOIN esports_categories ec ON ec.id = st.esport_category_id
LEFT JOIN esports e ON e.id = ec.esport_id LIMIT 10;

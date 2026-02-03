-- Migration Script: Migrate player stats from old schema to new
-- Purpose: Create player statistics for each game
-- Run AFTER games and players are migrated

-- ============================================================================
-- VALORANT PLAYER STATS MIGRATION
-- ============================================================================

-- Old valorant_matches_player_stats had:
-- id, player_id, match_id (references valorant_matches), agent_id,
-- acs, kills, deaths, assists, econ_rating, first_bloods, plants, defuses,
-- is_mvp, created_at

-- New stats_valorant_game_player has:
-- id (uuid), player_id, game_id, team_id, agent_name, acs, kills, deaths,
-- assists, first_bloods, created_at

-- Key differences:
-- 1. match_id (valorant_matches) -> game_id (games)
-- 2. agent_id -> agent_name (need to look up character name)
-- 3. Some fields dropped: econ_rating, plants, defuses, is_mvp

INSERT INTO stats_valorant_game_player (
  id,
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
  gen_random_uuid(), -- New ID
  ps.player_id,
  mvg.new_game_id, -- Mapped game ID
  st.id, -- schools_teams ID
  gc.name, -- Agent name from game_characters
  ps.acs,
  ps.kills,
  ps.deaths,
  ps.assists,
  ps.first_bloods,
  ps.created_at
FROM old_valorant_matches_player_stats ps
JOIN _migration_valorant_games mvg ON mvg.old_game_id = ps.match_id
JOIN players p ON p.id = ps.player_id
LEFT JOIN schools_teams st ON st.id = p.team_id
LEFT JOIN game_characters gc ON gc.id = ps.agent_id
WHERE NOT EXISTS (
  SELECT 1 FROM stats_valorant_game_player svgp
  WHERE svgp.player_id = ps.player_id AND svgp.game_id = mvg.new_game_id
);

-- ============================================================================
-- SAMPLE DATA INSERTIONS (for testing)
-- ============================================================================

-- You'll need to transform the old data format. Here's the expected format:
/*
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
VALUES
  ('02a7815d-3d92-40c9-8113-49343f175044', 1, 'some-team-uuid', 'Jett', 285, 25, 15, 4, 5, NOW()),
  ('4f0d445c-131c-4d82-8cec-dcaa3cb27801', 1, 'some-team-uuid', 'Omen', 220, 18, 12, 8, 2, NOW())
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- MLBB PLAYER STATS MIGRATION
-- ============================================================================

-- Old mlbb_matches_player_stats had:
-- id, created_at, player_id, match_id, hero_id, rating, is_mvp,
-- kills, deaths, assists, net_worth, hero_dmg, turret_dmg, dmg_tkn,
-- teamfight, turtle_slain, lord_slain

-- New stats_mlbb_game_player has:
-- id (uuid), player_id, game_id, team_id, hero_name, kills, deaths,
-- assists, gold, damage_dealt, turret_damage, damage_taken, created_at

INSERT INTO stats_mlbb_game_player (
  id,
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
  gen_random_uuid(), -- New ID
  ps.player_id,
  mmg.new_game_id, -- Mapped game ID
  st.id, -- schools_teams ID
  gc.name, -- Hero name from game_characters
  ps.kills,
  ps.deaths,
  ps.assists,
  ps.net_worth, -- Maps to gold
  ps.hero_dmg, -- Maps to damage_dealt
  ps.turret_dmg, -- Maps to turret_damage
  ps.dmg_tkn, -- Maps to damage_taken
  ps.created_at
FROM old_mlbb_matches_player_stats ps
JOIN _migration_mlbb_games mmg ON mmg.old_game_id = ps.match_id
JOIN players p ON p.id = ps.player_id
LEFT JOIN schools_teams st ON st.id = p.team_id
LEFT JOIN game_characters gc ON gc.id = ps.hero_id
WHERE NOT EXISTS (
  SELECT 1 FROM stats_mlbb_game_player smgp
  WHERE smgp.player_id = ps.player_id AND smgp.game_id = mmg.new_game_id
);

-- ============================================================================
-- SAMPLE DATA INSERTIONS (for testing)
-- ============================================================================

/*
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
VALUES
  ('1a3f905d-4e03-4a64-b24f-fbabea5c192d', 1, 'some-team-uuid', 'Fanny', 8, 3, 12, 15000, 45000, 2000, 18000, NOW()),
  ('30f60c53-db26-4339-8b96-638ba1bc6f30', 1, 'some-team-uuid', 'Tigreal', 2, 5, 18, 8000, 12000, 500, 65000, NOW())
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- Fields dropped in migration (stored for reference)
-- ============================================================================
-- Valorant: econ_rating, plants, defuses, is_mvp
-- MLBB: rating, is_mvp, teamfight, turtle_slain, lord_slain

-- If you need these fields, you can:
-- 1. Add them to the new tables via ALTER TABLE
-- 2. Store them in a separate "extended stats" table
-- 3. Create a JSONB column for additional metadata

-- ============================================================================
-- Verification
-- ============================================================================

-- Valorant stats
SELECT 
  p.ign,
  s.abbreviation as school,
  g.game_number,
  svgp.agent_name,
  svgp.kills,
  svgp.deaths,
  svgp.assists,
  svgp.acs

FROM stats_valorant_game_player svgp
JOIN players p ON p.id = svgp.player_id
JOIN games g ON g.id = svgp.game_id
LEFT JOIN schools_teams st ON st.id = svgp.team_id
LEFT JOIN schools s ON s.id = st.school_id
ORDER BY svgp.acs DESC
LIMIT 10;

-- MLBB stats
SELECT 
  p.ign,
  s.abbreviation as school,
  g.game_number,
  smgp.hero_name,
  smgp.kills,
  smgp.deaths,
  smgp.assists,
  smgp.gold,
  smgp.damage_dealt
FROM stats_mlbb_game_player smgp
JOIN players p ON p.id = smgp.player_id
JOIN games g ON g.id = smgp.game_id
LEFT JOIN schools_teams st ON st.id = smgp.team_id
LEFT JOIN schools s ON s.id = st.school_id
ORDER BY smgp.kills DESC
LIMIT 10;

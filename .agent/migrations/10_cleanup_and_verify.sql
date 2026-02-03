-- Migration Script: Cleanup and verification after full migration
-- Purpose: Remove temporary tables/functions and verify data integrity
-- Run AFTER all other migration scripts

-- ============================================================================
-- DROP TEMPORARY MIGRATION OBJECTS
-- ============================================================================

-- Drop helper functions
DROP FUNCTION IF EXISTS get_stage_id(UUID, UUID);
DROP FUNCTION IF EXISTS get_schools_team_id(UUID, INTEGER, INTEGER);

-- Drop mapping tables used during migration
DROP TABLE IF EXISTS _migration_series_to_matches;
DROP TABLE IF EXISTS _migration_valorant_games;
DROP TABLE IF EXISTS _migration_mlbb_games;
DROP TABLE IF EXISTS _migration_valo_games;

-- Drop player stats staging tables
DROP TABLE IF EXISTS _old_mlbb_player_stats_migration;
DROP TABLE IF EXISTS _old_valo_player_stats_migration;


-- ============================================================================
-- DATA INTEGRITY VERIFICATION
-- ============================================================================

-- 1. Verify all schools were migrated
SELECT 'Schools' as entity, COUNT(*) as count FROM schools;

-- 2. Verify seasons
SELECT 'Seasons' as entity, COUNT(*) as count FROM seasons;

-- 3. Verify esports_seasons_stages
SELECT 'Stages' as entity, COUNT(*) as count FROM esports_seasons_stages;

-- 4. Verify schools_teams
SELECT 'Schools Teams' as entity, COUNT(*) as count FROM schools_teams;

-- 5. Verify players
SELECT 'Players' as entity, COUNT(*) as count FROM players;

-- 6. Verify matches
SELECT 'Matches' as entity, COUNT(*) as count FROM matches;

-- 7. Verify match_participants (should be ~2x matches count)
SELECT 'Match Participants' as entity, COUNT(*) as count FROM match_participants;

-- 8. Verify games
SELECT 'Games' as entity, COUNT(*) as count FROM games;

-- 9. Verify game_scores
SELECT 'Game Scores' as entity, COUNT(*) as count FROM game_scores;

-- 10. Verify player stats
SELECT 'Valorant Stats' as entity, COUNT(*) as count FROM stats_valorant_game_player;
SELECT 'MLBB Stats' as entity, COUNT(*) as count FROM stats_mlbb_game_player;

-- ============================================================================
-- CHECK FOR ORPHANED RECORDS
-- ============================================================================

-- Players without teams
SELECT COUNT(*) as orphaned_players FROM players WHERE team_id IS NULL;

-- Matches without participants
SELECT COUNT(*) as matches_without_participants 
FROM matches m 
WHERE NOT EXISTS (SELECT 1 FROM match_participants mp WHERE mp.match_id = m.id);

-- Games without matches
SELECT COUNT(*) as orphaned_games 
FROM games g 
WHERE NOT EXISTS (SELECT 1 FROM matches m WHERE m.id = g.match_id);

-- Stats without valid players
SELECT COUNT(*) as orphaned_valo_stats 
FROM stats_valorant_game_player s 
WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.id = s.player_id);

SELECT COUNT(*) as orphaned_mlbb_stats 
FROM stats_mlbb_game_player s 
WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.id = s.player_id);

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT 
  'Migration Summary' as report,
  (SELECT COUNT(*) FROM schools) as schools,
  (SELECT COUNT(*) FROM seasons) as seasons,
  (SELECT COUNT(*) FROM esports_seasons_stages) as stages,
  (SELECT COUNT(*) FROM schools_teams) as teams,
  (SELECT COUNT(*) FROM players) as players,
  (SELECT COUNT(*) FROM matches) as matches,
  (SELECT COUNT(*) FROM games) as games;

-- ============================================================================
-- POST-MIGRATION TASKS
-- ============================================================================

-- 1. Update player photo_url if needed
-- UPDATE players SET photo_url = '...' WHERE photo_url IS NULL;

-- 2. Refresh any materialized views (if applicable)
-- REFRESH MATERIALIZED VIEW [view_name];

-- 3. Run ANALYZE on migrated tables for query optimization
ANALYZE schools;
ANALYZE seasons;
ANALYZE esports_seasons_stages;
ANALYZE schools_teams;
ANALYZE players;
ANALYZE player_seasons;
ANALYZE matches;
ANALYZE match_participants;
ANALYZE games;
ANALYZE game_scores;
ANALYZE stats_valorant_game_player;
ANALYZE stats_mlbb_game_player;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

/*
-- To rollback, run in reverse order:
DELETE FROM stats_mlbb_game_player WHERE created_at > '[migration_timestamp]';
DELETE FROM stats_valorant_game_player WHERE created_at > '[migration_timestamp]';
DELETE FROM game_scores WHERE created_at > '[migration_timestamp]';
DELETE FROM games WHERE created_at > '[migration_timestamp]';
DELETE FROM match_participants WHERE created_at > '[migration_timestamp]';
DELETE FROM matches WHERE created_at > '[migration_timestamp]';
DELETE FROM player_seasons WHERE created_at > '[migration_timestamp]';
DELETE FROM players WHERE created_at > '[migration_timestamp]';
DELETE FROM schools_teams WHERE created_at > '[migration_timestamp]';
DELETE FROM esports_seasons_stages WHERE created_at > '[migration_timestamp]';
DELETE FROM seasons WHERE created_at > '[migration_timestamp]';
DELETE FROM schools WHERE created_at > '[migration_timestamp]';

-- Drop mapping tables
DROP TABLE IF EXISTS _migration_series_to_matches;
DROP TABLE IF EXISTS _migration_valorant_games;
DROP TABLE IF EXISTS _migration_mlbb_games;
*/

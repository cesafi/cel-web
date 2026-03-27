-- Migration: Update active_api_exports to support URL-based filtering
-- This allows flexible query parameters instead of fixed columns

-- Step 1: Add new columns for URL-based approach
ALTER TABLE active_api_exports 
  ADD COLUMN IF NOT EXISTS base_url TEXT,
  ADD COLUMN IF NOT EXISTS query_params JSONB DEFAULT '{}'::jsonb;

-- Step 2: Update existing records to use the new structure
-- For draft and game-results, we'll keep game_id for backward compatibility
-- but also populate the base_url with dynamic route patterns

UPDATE active_api_exports SET base_url = '/api/games/draft/[gameId]' WHERE title = 'draft';
UPDATE active_api_exports SET base_url = '/api/games/game-results/[gameId]' WHERE title = 'game-results';

-- Step 3: Insert all export API routes with their base URLs and default query params
INSERT INTO active_api_exports (title, base_url, query_params) VALUES
  ('character-stats', '/api/export/characters/stats', '{"game": "mlbb"}'::jsonb),
  ('player-leaderboard', '/api/export/players/leaderboard', '{"game": "mlbb", "metric": "total_kills", "limit": 5}'::jsonb),
  ('player-stats', '/api/export/players/stats', '{"game": "mlbb"}'::jsonb),
  ('team-stats', '/api/export/teams/stats', '{"game": "mlbb"}'::jsonb),
  ('map-stats', '/api/export/maps/stats', '{"game": "mlbb"}'::jsonb),
  ('h2h-players', '/api/export/head-to-head/players', '{"game": "mlbb"}'::jsonb),
  ('h2h-teams', '/api/export/head-to-head/teams', '{"game": "mlbb"}'::jsonb),
  ('standings', '/api/export/standings', '{}'::jsonb),
  ('standings-data', '/api/export/standings-data', '{}'::jsonb),
  ('match-overview', '/api/export/matches/[matchId]', '{}'::jsonb),
  ('valorant-map-veto', '/api/export/valorant-map-veto', '{}'::jsonb),
  ('filters', '/api/export/filters', '{}'::jsonb)
ON CONFLICT (title) DO UPDATE SET
  base_url = EXCLUDED.base_url,
  query_params = EXCLUDED.query_params;

-- Optional Step 4: If you want to eventually remove game_id and match_id columns
-- (Only do this after updating all code to use the new approach)
-- ALTER TABLE active_api_exports DROP COLUMN IF EXISTS game_id;
-- ALTER TABLE active_api_exports DROP COLUMN IF EXISTS match_id;

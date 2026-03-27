-- Insert all API export routes into active_api_exports
-- Using the current schema (title, game_id, match_id)
-- game_id and match_id will be set to NULL initially and updated via the admin UI

INSERT INTO active_api_exports (title, game_id, match_id) VALUES
  ('draft', NULL, NULL),
  ('game-results', NULL, NULL),
  ('character-stats', NULL, NULL),
  ('player-leaderboard', NULL, NULL),
  ('player-stats', NULL, NULL),
  ('team-stats', NULL, NULL),
  ('map-stats', NULL, NULL),
  ('h2h-players', NULL, NULL),
  ('h2h-teams', NULL, NULL),
  ('standings', NULL, NULL),
  ('standings-data', NULL, NULL),
  ('match-overview', NULL, NULL),
  ('valorant-map-veto', NULL, NULL),
  ('filters', NULL, NULL)
ON CONFLICT (title) DO NOTHING;

-- Note: This assumes 'title' has a unique constraint
-- If not, you may need to add one first:
-- ALTER TABLE active_api_exports ADD CONSTRAINT active_api_exports_title_key UNIQUE (title);

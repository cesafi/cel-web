-- Create Player Stats Tables
-- Run this BEFORE migrating player stats data

-- ============================================================================
-- VALORANT PLAYER STATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS stats_valorant_game_player (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID REFERENCES schools_teams(id) ON DELETE SET NULL,
  agent_name TEXT,
  acs INTEGER,
  kills INTEGER,
  deaths INTEGER,
  assists INTEGER,
  first_bloods INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate stats
  UNIQUE(player_id, game_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_stats_valo_player ON stats_valorant_game_player(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_valo_game ON stats_valorant_game_player(game_id);
CREATE INDEX IF NOT EXISTS idx_stats_valo_team ON stats_valorant_game_player(team_id);

-- Enable RLS
ALTER TABLE stats_valorant_game_player ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public read access for valorant stats"
  ON stats_valorant_game_player FOR SELECT
  TO public
  USING (true);

-- Admin write policy  
CREATE POLICY "Admin write access for valorant stats"
  ON stats_valorant_game_player FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- MLBB PLAYER STATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS stats_mlbb_game_player (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID REFERENCES schools_teams(id) ON DELETE SET NULL,
  hero_name TEXT,
  kills INTEGER,
  deaths INTEGER,
  assists INTEGER,
  gold INTEGER,
  damage_dealt INTEGER,
  turret_damage INTEGER,
  damage_taken INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate stats
  UNIQUE(player_id, game_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_stats_mlbb_player ON stats_mlbb_game_player(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_mlbb_game ON stats_mlbb_game_player(game_id);  
CREATE INDEX IF NOT EXISTS idx_stats_mlbb_team ON stats_mlbb_game_player(team_id);

-- Enable RLS
ALTER TABLE stats_mlbb_game_player ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public read access for mlbb stats"
  ON stats_mlbb_game_player FOR SELECT
  TO public
  USING (true);

-- Admin write policy
CREATE POLICY "Admin write access for mlbb stats"  
  ON stats_mlbb_game_player FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Valorant stats table: ' || COUNT(*)::text as valorant_stats FROM stats_valorant_game_player;
SELECT 'MLBB stats table: ' || COUNT(*)::text as mlbb_stats FROM stats_mlbb_game_player;

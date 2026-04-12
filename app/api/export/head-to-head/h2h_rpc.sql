-- RPC Function to handle Head-to-Head calculations in the database
-- Focuses on high performance by aggregating Materialized Views and calculating 
-- character pool sizes in a single pass.

-- ── 0. Cleanup legacy signature (prevents PGRST203 overloading error) ──
DROP FUNCTION IF EXISTS get_h2h_comparison(text, text, text, text, int, int);

-- ── 1. Create optimized H2H function ──
CREATE OR REPLACE FUNCTION get_h2h_comparison(
  p_game text,           -- 'mlbb' or 'valorant'
  p_type text,           -- 'teams' or 'players'
  p_id_a uuid,           -- UUID
  p_id_b uuid,           -- UUID
  p_season_id int DEFAULT NULL,
  p_stage_id int DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_result_a json;
  v_result_b json;
BEGIN
  -----------------------------------------------------------------------------
  -- CASE 1: MLBB TEAMS
  -----------------------------------------------------------------------------
  IF p_game = 'mlbb' AND p_type = 'teams' THEN
    WITH base_stats AS (
      SELECT 
        team_id, team_name, school_abbreviation,
        SUM(games_played) as games_played,
        SUM(wins) as total_wins,
        SUM(total_kills) as total_kills,
        SUM(total_deaths) as total_deaths,
        SUM(total_assists) as total_assists,
        SUM(total_gold) as total_gold,
        SUM(total_damage_dealt) as total_damage_dealt,
        SUM(total_lord_slain) as total_lord_slain,
        SUM(total_turtle_slain) as total_turtle_slain,
        SUM(total_turret_damage) as total_turret_damage
      FROM mv_mlbb_team_stats
      WHERE team_id IN (p_id_a, p_id_b)
        AND (p_season_id IS NULL OR season_id = p_season_id)
        AND (p_stage_id IS NULL OR stage_id = p_stage_id)
      GROUP BY team_id, team_name, school_abbreviation
    ),
    dmg_taken_stats AS (
        SELECT 
          team_id, 
          SUM(total_damage_taken) as total_damage_taken,
          CASE WHEN SUM(games_played) > 0 THEN SUM(avg_rating * games_played) / SUM(games_played) ELSE 0 END as avg_rating,
          CASE WHEN SUM(games_played) > 0 THEN SUM(avg_teamfight_percent * games_played) / SUM(games_played) ELSE 0 END as avg_teamfight_percent
        FROM mv_mlbb_player_stats
        WHERE team_id IN (p_id_a, p_id_b)
          AND (p_season_id IS NULL OR season_id = p_season_id)
          AND (p_stage_id IS NULL OR stage_id = p_stage_id)
        GROUP BY team_id
    ),
    team_stats AS (
      SELECT 
        b.*,
        COALESCE(dt.total_damage_taken, 0) as total_damage_taken,
        COALESCE(dt.avg_rating, 0) as avg_rating,
        COALESCE(dt.avg_teamfight_percent, 0) as avg_teamfight_percent,
        CASE WHEN b.games_played > 0 THEN (b.total_wins::float / b.games_played) * 100 ELSE 0 END as win_rate,
        CASE WHEN b.games_played > 0 THEN b.total_gold::float / b.games_played ELSE 0 END as avg_gold_per_game,
        CASE WHEN b.games_played > 0 THEN b.total_damage_dealt::float / b.games_played ELSE 0 END as avg_damage_per_game,
        CASE WHEN b.games_played > 0 THEN b.total_kills::float / b.games_played ELSE 0 END as avg_kills_per_game,
        CASE WHEN b.games_played > 0 THEN b.total_deaths::float / b.games_played ELSE 0 END as avg_deaths_per_game,
        CASE WHEN b.games_played > 0 THEN b.total_assists::float / b.games_played ELSE 0 END as avg_assists_per_game
      FROM base_stats b
      LEFT JOIN dmg_taken_stats dt ON b.team_id = dt.team_id
    ),
    pool_stats AS (
      SELECT 
        team_id, count(DISTINCT hero_id) as unique_chars
      FROM mv_mlbb_hero_stats
      WHERE team_id IN (p_id_a, p_id_b)
        AND (p_season_id IS NULL OR season_id = p_season_id)
        AND (p_stage_id IS NULL OR stage_id = p_stage_id)
      GROUP BY team_id
    )
    SELECT 
      json_agg(to_jsonb(t) || jsonb_build_object('unique_chars', COALESCE(p.unique_chars, 0))) FILTER (WHERE t.team_id = p_id_a),
      json_agg(to_jsonb(t) || jsonb_build_object('unique_chars', COALESCE(p.unique_chars, 0))) FILTER (WHERE t.team_id = p_id_b)
    INTO v_result_a, v_result_b
    FROM team_stats t
    LEFT JOIN pool_stats p ON t.team_id = p.team_id;

  -----------------------------------------------------------------------------
  -- CASE 2: VALORANT TEAMS
  -----------------------------------------------------------------------------
  ELSIF p_game = 'valorant' AND p_type = 'teams' THEN
    WITH base_stats AS (
      SELECT 
        team_id, team_name, school_abbreviation,
        SUM(games_played) as games_played,
        SUM(wins) as total_wins,
        SUM(total_kills) as total_kills,
        SUM(total_deaths) as total_deaths,
        SUM(total_assists) as total_assists,
        SUM(total_first_bloods) as total_first_bloods,
        SUM(total_plants) as total_plants,
        SUM(total_defuses) as total_defuses,
        CASE WHEN SUM(games_played) > 0 THEN SUM(avg_acs * games_played) / SUM(games_played) ELSE 0 END as avg_acs
      FROM mv_valorant_team_stats
      WHERE team_id IN (p_id_a, p_id_b)
        AND (p_season_id IS NULL OR season_id = p_season_id)
        AND (p_stage_id IS NULL OR stage_id = p_stage_id)
      GROUP BY team_id, team_name, school_abbreviation
    ),
    player_agg_stats AS (
      SELECT 
        team_id,
        CASE WHEN SUM(games_played) > 0 THEN SUM(avg_econ_rating * games_played) / SUM(games_played) ELSE 0 END as avg_econ_rating
      FROM mv_valorant_player_stats
      WHERE team_id IN (p_id_a, p_id_b)
        AND (p_season_id IS NULL OR season_id = p_season_id)
        AND (p_stage_id IS NULL OR stage_id = p_stage_id)
      GROUP BY team_id
    ),
    round_stats AS (
      SELECT 
        mp.team_id,
        SUM(gs_total.sum_score) as total_rounds_played
      FROM match_participants mp
      JOIN games g ON mp.match_id = g.match_id
      JOIN (
        SELECT game_id, SUM(score) as sum_score
        FROM game_scores
        GROUP BY game_id
      ) gs_total ON g.id = gs_total.game_id
      JOIN matches m ON g.match_id = m.id
      JOIN esports_seasons_stages ess ON m.stage_id = ess.id
      WHERE mp.team_id IN (p_id_a, p_id_b)
        AND g.status = 'completed'
        AND (p_season_id IS NULL OR ess.season_id = p_season_id)
        AND (p_stage_id IS NULL OR m.stage_id = p_stage_id)
      GROUP BY mp.team_id
    ),
    team_stats AS (
      SELECT 
        b.*,
        COALESCE(pa.avg_econ_rating, 0) as avg_econ_rating,
        COALESCE(rs.total_rounds_played, 0) as total_rounds_played,
        CASE WHEN b.games_played > 0 THEN (b.total_wins::float / b.games_played) * 100 ELSE 0 END as win_rate,
        CASE WHEN b.games_played > 0 THEN b.total_kills::float / b.games_played ELSE 0 END as avg_kills_per_game,
        CASE WHEN b.games_played > 0 THEN b.total_deaths::float / b.games_played ELSE 0 END as avg_deaths_per_game,
        CASE WHEN b.games_played > 0 THEN b.total_assists::float / b.games_played ELSE 0 END as avg_assists_per_game
      FROM base_stats b
      LEFT JOIN player_agg_stats pa ON b.team_id = pa.team_id
      LEFT JOIN round_stats rs ON b.team_id = rs.team_id
    ),
    pool_stats AS (
      SELECT 
        team_id, count(DISTINCT agent_id) as unique_chars
      FROM mv_valorant_agent_stats
      WHERE team_id IN (p_id_a, p_id_b)
        AND (p_season_id IS NULL OR season_id = p_season_id)
        AND (p_stage_id IS NULL OR stage_id = p_stage_id)
      GROUP BY team_id
    )
    SELECT 
      json_agg(to_jsonb(t) || jsonb_build_object('unique_chars', COALESCE(p.unique_chars, 0))) FILTER (WHERE t.team_id = p_id_a),
      json_agg(to_jsonb(t) || jsonb_build_object('unique_chars', COALESCE(p.unique_chars, 0))) FILTER (WHERE t.team_id = p_id_b)
    INTO v_result_a, v_result_b
    FROM team_stats t
    LEFT JOIN pool_stats p ON t.team_id = p.team_id;

  -----------------------------------------------------------------------------
  -- CASE 3: MLBB PLAYERS
  -----------------------------------------------------------------------------
  ELSIF p_game = 'mlbb' AND p_type = 'players' THEN
    WITH base_stats AS (
      SELECT 
        player_id, player_ign, team_name,
        SUM(games_played) as games_played,
        SUM(wins) as wins,
        SUM(mvp_count) as mvp_count,
        SUM(total_kills) as total_kills,
        SUM(total_deaths) as total_deaths,
        SUM(total_assists) as total_assists,
        SUM(total_gold) as total_gold,
        SUM(total_damage_dealt) as total_damage_dealt,
        SUM(total_damage_taken) as total_damage_taken,
        SUM(total_turret_damage) as total_turret_damage,
        CASE WHEN SUM(games_played) > 0 THEN SUM(avg_gpm * games_played) / SUM(games_played) ELSE 0 END as avg_gpm,
        CASE WHEN SUM(games_played) > 0 THEN SUM(avg_rating * games_played) / SUM(games_played) ELSE 0 END as avg_rating,
        CASE WHEN SUM(games_played) > 0 THEN SUM(avg_teamfight_percent * games_played) / SUM(games_played) ELSE 0 END as avg_teamfight_percent
      FROM mv_mlbb_player_stats
      WHERE player_id IN (p_id_a, p_id_b)
        AND (p_season_id IS NULL OR season_id = p_season_id)
        AND (p_stage_id IS NULL OR stage_id = p_stage_id)
      GROUP BY player_id, player_ign, team_name
    ),
    player_stats AS (
      SELECT 
        b.*,
        CASE WHEN b.games_played > 0 THEN (b.wins::float / b.games_played) * 100 ELSE 0 END as win_rate,
        CASE WHEN b.games_played > 0 THEN b.total_kills::float / b.games_played ELSE 0 END as avg_kills,
        CASE WHEN b.games_played > 0 THEN b.total_deaths::float / b.games_played ELSE 0 END as avg_deaths,
        CASE WHEN b.games_played > 0 THEN b.total_assists::float / b.games_played ELSE 0 END as avg_assists
      FROM base_stats b
    ),
    pool_stats AS (
      SELECT 
        s.player_id, count(DISTINCT s.game_character_id) as unique_chars
      FROM stats_mlbb_game_player s
      JOIN games g ON s.game_id = g.id
      JOIN matches m ON g.match_id = m.id
      JOIN esports_seasons_stages ess ON m.stage_id = ess.id
      WHERE s.player_id IN (p_id_a, p_id_b)
        AND (p_season_id IS NULL OR ess.season_id = p_season_id)
        AND (p_stage_id IS NULL OR m.stage_id = p_stage_id)
      GROUP BY s.player_id
    )
    SELECT 
      json_agg(to_jsonb(t) || jsonb_build_object('unique_chars', COALESCE(p.unique_chars, 0))) FILTER (WHERE t.player_id = p_id_a),
      json_agg(to_jsonb(t) || jsonb_build_object('unique_chars', COALESCE(p.unique_chars, 0))) FILTER (WHERE t.player_id = p_id_b)
    INTO v_result_a, v_result_b
    FROM player_stats t
    LEFT JOIN pool_stats p ON t.player_id = p.player_id;

  -----------------------------------------------------------------------------
  -- CASE 4: VALORANT PLAYERS
  -----------------------------------------------------------------------------
  ELSIF p_game = 'valorant' AND p_type = 'players' THEN
    WITH base_stats AS (
      SELECT 
        player_id, player_ign, team_name,
        SUM(games_played) as games_played,
        SUM(wins) as wins,
        SUM(mvp_count) as mvp_count,
        SUM(total_kills) as total_kills,
        SUM(total_deaths) as total_deaths,
        SUM(total_assists) as total_assists,
        SUM(total_first_bloods) as total_first_bloods,
        SUM(total_plants) as total_plants,
        SUM(total_defuses) as total_defuses,
        CASE WHEN SUM(games_played) > 0 THEN SUM(avg_acs * games_played) / SUM(games_played) ELSE 0 END as avg_acs,
        CASE WHEN SUM(games_played) > 0 THEN SUM(avg_econ_rating * games_played) / SUM(games_played) ELSE 0 END as avg_econ_rating
      FROM mv_valorant_player_stats
      WHERE player_id IN (p_id_a, p_id_b)
        AND (p_season_id IS NULL OR season_id = p_season_id)
        AND (p_stage_id IS NULL OR stage_id = p_stage_id)
      GROUP BY player_id, player_ign, team_name
    ),
    round_stats AS (
      SELECT 
        s.player_id,
        SUM(gs_total.sum_score) as total_rounds_played
      FROM stats_valorant_game_player s
      JOIN games g ON s.game_id = g.id
      JOIN (
        SELECT game_id, SUM(score) as sum_score
        FROM game_scores
        GROUP BY game_id
      ) gs_total ON g.id = gs_total.game_id
      JOIN matches m ON g.match_id = m.id
      JOIN esports_seasons_stages ess ON m.stage_id = ess.id
      WHERE s.player_id IN (p_id_a, p_id_b)
        AND g.status = 'completed'
        AND (p_season_id IS NULL OR ess.season_id = p_season_id)
        AND (p_stage_id IS NULL OR m.stage_id = p_stage_id)
      GROUP BY s.player_id
    ),
    player_stats AS (
      SELECT 
        b.*,
        COALESCE(rs.total_rounds_played, 0) as total_rounds_played,
        CASE WHEN b.games_played > 0 THEN (b.wins::float / b.games_played) * 100 ELSE 0 END as win_rate,
        CASE WHEN b.games_played > 0 THEN b.total_kills::float / b.games_played ELSE 0 END as avg_kills,
        CASE WHEN b.games_played > 0 THEN b.total_deaths::float / b.games_played ELSE 0 END as avg_deaths,
        CASE WHEN b.games_played > 0 THEN b.total_assists::float / b.games_played ELSE 0 END as avg_assists
      FROM base_stats b
      LEFT JOIN round_stats rs ON b.player_id = rs.player_id
    ),
    pool_stats AS (
      SELECT 
        s.player_id, count(DISTINCT s.game_character_id) as unique_chars
      FROM stats_valorant_game_player s
      JOIN games g ON s.game_id = g.id
      JOIN matches m ON g.match_id = m.id
      JOIN esports_seasons_stages ess ON m.stage_id = ess.id
      WHERE s.player_id IN (p_id_a, p_id_b)
        AND (p_season_id IS NULL OR ess.season_id = p_season_id)
        AND (p_stage_id IS NULL OR m.stage_id = p_stage_id)
      GROUP BY s.player_id
    )
    SELECT 
      json_agg(to_jsonb(t) || jsonb_build_object('unique_chars', COALESCE(p.unique_chars, 0))) FILTER (WHERE t.player_id = p_id_a),
      json_agg(to_jsonb(t) || jsonb_build_object('unique_chars', COALESCE(p.unique_chars, 0))) FILTER (WHERE t.player_id = p_id_b)
    INTO v_result_a, v_result_b
    FROM player_stats t
    LEFT JOIN pool_stats p ON t.player_id = p.player_id;

  END IF;

  RETURN json_build_object(
    'a', COALESCE(v_result_a->0, '{}'::json), 
    'b', COALESCE(v_result_b->0, '{}'::json)
  );
END;
$$ LANGUAGE plpgsql;

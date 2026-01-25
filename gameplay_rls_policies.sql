-- Gameplay & Stats Tables RLS Policies
-- Pattern:
-- 1. CLEANUP: Remove ALL existing policies.
-- 2. Enable RLS
-- 3. Public can View All (SELECT)
-- 4. Admins AND League Operators have Full Access (ALL)

-- List of tables:
-- game_hero_bans, game_scores, games, match_participants, matches, player_seasons, players

-------------------------------------------------------------------------------
-- 0. CLEANUP EXISTING POLICIES
-------------------------------------------------------------------------------
DO $$
DECLARE
  -- List of tables to clean
  tables text[] := ARRAY[
    'game_hero_bans', 
    'game_scores', 
    'games', 
    'match_participants', 
    'matches', 
    'player_seasons', 
    'players'
  ];
  t text;
  pol pg_policies%ROWTYPE;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pol IN SELECT * FROM pg_policies WHERE tablename = t AND schemaname = 'public' LOOP
      RAISE NOTICE 'Dropping policy % on table %', pol.policyname, t;
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;


-------------------------------------------------------------------------------
-- 1. game_hero_bans
-------------------------------------------------------------------------------
ALTER TABLE public.game_hero_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view game_hero_bans"
ON public.game_hero_bans FOR SELECT TO public USING (true);

CREATE POLICY "Admins and League Ops have full access to game_hero_bans"
ON public.game_hero_bans FOR ALL TO authenticated
USING (is_admin() OR is_league_operator())
WITH CHECK (is_admin() OR is_league_operator());

-------------------------------------------------------------------------------
-- 2. game_scores
-------------------------------------------------------------------------------
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view game_scores"
ON public.game_scores FOR SELECT TO public USING (true);

CREATE POLICY "Admins and League Ops have full access to game_scores"
ON public.game_scores FOR ALL TO authenticated
USING (is_admin() OR is_league_operator())
WITH CHECK (is_admin() OR is_league_operator());

-------------------------------------------------------------------------------
-- 3. games
-------------------------------------------------------------------------------
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view games"
ON public.games FOR SELECT TO public USING (true);

CREATE POLICY "Admins and League Ops have full access to games"
ON public.games FOR ALL TO authenticated
USING (is_admin() OR is_league_operator())
WITH CHECK (is_admin() OR is_league_operator());

-------------------------------------------------------------------------------
-- 4. match_participants
-------------------------------------------------------------------------------
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view match_participants"
ON public.match_participants FOR SELECT TO public USING (true);

CREATE POLICY "Admins and League Ops have full access to match_participants"
ON public.match_participants FOR ALL TO authenticated
USING (is_admin() OR is_league_operator())
WITH CHECK (is_admin() OR is_league_operator());

-------------------------------------------------------------------------------
-- 5. matches
-------------------------------------------------------------------------------
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view matches"
ON public.matches FOR SELECT TO public USING (true);

CREATE POLICY "Admins and League Ops have full access to matches"
ON public.matches FOR ALL TO authenticated
USING (is_admin() OR is_league_operator())
WITH CHECK (is_admin() OR is_league_operator());

-------------------------------------------------------------------------------
-- 6. player_seasons
-------------------------------------------------------------------------------
ALTER TABLE public.player_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view player_seasons"
ON public.player_seasons FOR SELECT TO public USING (true);

CREATE POLICY "Admins and League Ops have full access to player_seasons"
ON public.player_seasons FOR ALL TO authenticated
USING (is_admin() OR is_league_operator())
WITH CHECK (is_admin() OR is_league_operator());

-------------------------------------------------------------------------------
-- 7. players
-------------------------------------------------------------------------------
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view players"
ON public.players FOR SELECT TO public USING (true);

CREATE POLICY "Admins and League Ops have full access to players"
ON public.players FOR ALL TO authenticated
USING (is_admin() OR is_league_operator())
WITH CHECK (is_admin() OR is_league_operator());

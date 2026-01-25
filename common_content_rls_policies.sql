-- Common Content Tables RLS Policies
-- Pattern:
-- 1. CLEANUP: Remove ALL existing policies from target tables to ensure a clean slate.
-- 2. Enable RLS
-- 3. Public can View All (SELECT)
-- 4. Admins have Full Access (ALL)

-------------------------------------------------------------------------------
-- 0. CLEANUP EXISTING POLICIES
-- This block loops through the target tables and drops ALL existing RLS policies.
-------------------------------------------------------------------------------
DO $$
DECLARE
  -- List of tables to clean
  tables text[] := ARRAY[
    'departments', 
    'esports', 
    'esports_categories', 
    'esports_seasons_stages', 
    'game_characters', 
    'hero_section_live', 
    'mlbb_items', 
    'photo_gallery', 
    'schools', 
    'schools_teams', 
    'seasons', 
    'sponsors', 
    'valorant_maps', 
    'volunteers'
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
-- 1. departments
-------------------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view departments"
ON public.departments FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to departments"
ON public.departments FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 2. esports
-------------------------------------------------------------------------------
ALTER TABLE public.esports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view esports"
ON public.esports FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to esports"
ON public.esports FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 3. esports_categories
-------------------------------------------------------------------------------
ALTER TABLE public.esports_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view esports_categories"
ON public.esports_categories FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to esports_categories"
ON public.esports_categories FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 4. esports_seasons_stages
-------------------------------------------------------------------------------
ALTER TABLE public.esports_seasons_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view esports_seasons_stages"
ON public.esports_seasons_stages FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to esports_seasons_stages"
ON public.esports_seasons_stages FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 5. game_characters
-------------------------------------------------------------------------------
ALTER TABLE public.game_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view game_characters"
ON public.game_characters FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to game_characters"
ON public.game_characters FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 6. hero_section_live
-------------------------------------------------------------------------------
ALTER TABLE public.hero_section_live ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view hero_section_live"
ON public.hero_section_live FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to hero_section_live"
ON public.hero_section_live FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 7. mlbb_items
-------------------------------------------------------------------------------
ALTER TABLE public.mlbb_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view mlbb_items"
ON public.mlbb_items FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to mlbb_items"
ON public.mlbb_items FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 8. photo_gallery
-------------------------------------------------------------------------------
ALTER TABLE public.photo_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view photo_gallery"
ON public.photo_gallery FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to photo_gallery"
ON public.photo_gallery FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 9. schools
-------------------------------------------------------------------------------
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view schools"
ON public.schools FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to schools"
ON public.schools FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 10. schools_teams
-------------------------------------------------------------------------------
ALTER TABLE public.schools_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view schools_teams"
ON public.schools_teams FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to schools_teams"
ON public.schools_teams FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 11. seasons
-------------------------------------------------------------------------------
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view seasons"
ON public.seasons FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to seasons"
ON public.seasons FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 12. sponsors
-------------------------------------------------------------------------------
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view sponsors"
ON public.sponsors FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to sponsors"
ON public.sponsors FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 13. valorant_maps
-------------------------------------------------------------------------------
ALTER TABLE public.valorant_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view valorant_maps"
ON public.valorant_maps FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to valorant_maps"
ON public.valorant_maps FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-------------------------------------------------------------------------------
-- 14. volunteers
-------------------------------------------------------------------------------
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view volunteers"
ON public.volunteers FOR SELECT TO public USING (true);

CREATE POLICY "Admins have full access to volunteers"
ON public.volunteers FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

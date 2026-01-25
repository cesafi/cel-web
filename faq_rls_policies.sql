-- FAQ Table RLS Policies
-- Pattern (matches cesafi_timeline):
-- 1. CLEANUP: Remove ALL existing policies.
-- 2. Enable RLS
-- 3. Public can View All (SELECT)
-- 4. Admins AND Head Writers have Full Access (ALL)

-------------------------------------------------------------------------------
-- 0. CLEANUP EXISTING POLICIES
-------------------------------------------------------------------------------
DO $$
DECLARE
  t text := 'faq';
  pol pg_policies%ROWTYPE;
BEGIN
  FOR pol IN SELECT * FROM pg_policies WHERE tablename = t AND schemaname = 'public' LOOP
    RAISE NOTICE 'Dropping policy % on table %', pol.policyname, t;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
  END LOOP;
END $$;

-------------------------------------------------------------------------------
-- 1. Enable RLS
-------------------------------------------------------------------------------
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- 2. Public Read Policy
-------------------------------------------------------------------------------
CREATE POLICY "Public can view faq"
ON public.faq
FOR SELECT
TO public
USING (true);

-------------------------------------------------------------------------------
-- 3. Admin & Head Writer Full Access
-------------------------------------------------------------------------------
CREATE POLICY "Admins and Head Writers have full access to faq"
ON public.faq
FOR ALL
TO authenticated
USING (
  is_admin() OR is_head_writer()
)
WITH CHECK (
  is_admin() OR is_head_writer()
);

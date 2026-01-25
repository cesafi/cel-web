-- Enable Row Level Security on the cesafi_timeline table
ALTER TABLE public.cesafi_timeline ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- 1. Public Read Policy
-- Allow anyone (public) to read all timeline entries.
-------------------------------------------------------------------------------
CREATE POLICY "Public can view timeline"
ON public.cesafi_timeline
FOR SELECT
TO public
USING (true);

-------------------------------------------------------------------------------
-- 2. Admin & Head Writer Full Access
-- Admins and Head Writers can do anything (SELECT, INSERT, UPDATE, DELETE).
-------------------------------------------------------------------------------
CREATE POLICY "Admins and Head Writers have full access"
ON public.cesafi_timeline
FOR ALL
TO authenticated
USING (
  is_admin() OR is_head_writer()
)
WITH CHECK (
  is_admin() OR is_head_writer()
);

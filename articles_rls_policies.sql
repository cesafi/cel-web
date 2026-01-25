-- Enable Row Level Security on the articles table
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- 1. Public Read Policy
-- Allow anyone (public) to read articles that are 'published' or 'featured'.
-------------------------------------------------------------------------------
CREATE POLICY "Public can view published articles"
ON public.articles
FOR SELECT
TO public
USING (
  status IN ('published', 'featured')
);

-------------------------------------------------------------------------------
-- 2. Admin & Head Writer Full Access
-- Admins and Head Writers can do anything (SELECT, INSERT, UPDATE, DELETE).
-------------------------------------------------------------------------------
CREATE POLICY "Admins and Head Writers have full access"
ON public.articles
FOR ALL
TO authenticated
USING (
  is_admin() OR is_head_writer()
)
WITH CHECK (
  is_admin() OR is_head_writer()
);

-------------------------------------------------------------------------------
-- 3. Writers Create Policy
-- Writers can insert new articles.
-- Note: 'authored_by' is not enforced to match auth.uid() per request.
-------------------------------------------------------------------------------
CREATE POLICY "Writers can insert articles"
ON public.articles
FOR INSERT
TO authenticated
WITH CHECK (
  is_writer()
);

-------------------------------------------------------------------------------
-- 4. Writers Update Policy
-- Writers can update ANY article.
-------------------------------------------------------------------------------
CREATE POLICY "Writers can update articles"
ON public.articles
FOR UPDATE
TO authenticated
USING (
  is_writer()
)
WITH CHECK (
  is_writer()
);

-------------------------------------------------------------------------------
-- 5. Writers Select Policy
-- Writers can view ALL articles (drafts, archived, etc.), not just published ones.
-- This is needed so they can see what they are editing.
-------------------------------------------------------------------------------
CREATE POLICY "Writers can view all articles"
ON public.articles
FOR SELECT
TO authenticated
USING (
  is_writer()
);

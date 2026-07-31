-- Admin-managed vocabularies and marketing copy.
--
-- Two tables, both public-read / admin-write, both using the SECURITY DEFINER
-- helper public.get_my_role() rather than an inline subquery on public.users —
-- see 20260728120000_admin_rls_get_my_role.sql for why an inline subquery
-- silently returns no row for admins.
--
--   site_options  the controlled vocabularies (instruments, genres, …) that
--                 were compile-time constants in src/lib/mmm/options.ts. The
--                 constants stay as the seed and as the fallback when the table
--                 has no rows for a kind, so the forms keep working if a
--                 deployment runs ahead of this migration.
--
--   site_content  per-field overrides for the marketing pages. Only keys an
--                 admin has actually edited are stored; everything else falls
--                 back to the text compiled into the page, so an empty table
--                 means the site reads exactly as it does today.

-- ── SITE OPTIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        TEXT NOT NULL,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT site_options_kind_label_key UNIQUE (kind, label)
);

-- The forms read by kind and show active entries in order; this covers both.
CREATE INDEX IF NOT EXISTS site_options_kind_sort_idx
  ON public.site_options (kind, sort_order, label);

ALTER TABLE public.site_options ENABLE ROW LEVEL SECURITY;

-- Readable by everyone: the registration wizards are filled in by people who
-- have no account yet, so this cannot be restricted to authenticated.
DROP POLICY IF EXISTS "site_options_public_read" ON public.site_options;
CREATE POLICY "site_options_public_read"
  ON public.site_options
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "site_options_admin_write" ON public.site_options;
CREATE POLICY "site_options_admin_write"
  ON public.site_options
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ── SITE CONTENT ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_content (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_content_public_read" ON public.site_content;
CREATE POLICY "site_content_public_read"
  ON public.site_content
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "site_content_admin_write" ON public.site_content;
CREATE POLICY "site_content_admin_write"
  ON public.site_content
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ── SEED THE VOCABULARIES ────────────────────────────────────────────────────
-- Mirrors src/lib/mmm/options.ts as of this migration. ON CONFLICT DO NOTHING
-- so re-running never clobbers an edit an admin has since made.
INSERT INTO public.site_options (kind, label, sort_order)
SELECT 'instrument', label, ordinality
FROM unnest(ARRAY[
  'Vocals','Acoustic guitar','Electric guitar','Piano','Keyboard','Violin','Viola','Cello',
  'Flute','Clarinet','Saxophone','Trumpet','Trombone','Harmonica','Ukulele','Banjo',
  'Mandolin','Accordion','Harp','Percussion','Bass','Other'
]) WITH ORDINALITY AS t(label, ordinality)
ON CONFLICT (kind, label) DO NOTHING;

INSERT INTO public.site_options (kind, label, sort_order)
SELECT 'genre', label, ordinality
FROM unnest(ARRAY[
  'Big band & swing','Jazz','Classical','Folk','Country','Gospel & hymns','Broadway & standards',
  'Oldies (50s–60s)','Rock (60s–70s)','Latin','Holiday','Patriotic'
]) WITH ORDINALITY AS t(label, ordinality)
ON CONFLICT (kind, label) DO NOTHING;

INSERT INTO public.site_options (kind, label, sort_order)
SELECT 'language', label, ordinality
FROM unnest(ARRAY[
  'English','Spanish','Haitian Creole','Portuguese','French','Russian','Other'
]) WITH ORDINALITY AS t(label, ordinality)
ON CONFLICT (kind, label) DO NOTHING;

INSERT INTO public.site_options (kind, label, sort_order)
SELECT 'performance_type', label, ordinality
FROM unnest(ARRAY[
  'Solo','Duo','Small group (3–5)','Large group (6+)','Choir or vocal ensemble'
]) WITH ORDINALITY AS t(label, ordinality)
ON CONFLICT (kind, label) DO NOTHING;

INSERT INTO public.site_options (kind, label, sort_order)
SELECT 'performance_location', label, ordinality
FROM unnest(ARRAY[
  'Activity room','Dining room','Common lounge','Courtyard or patio',
  'Memory care neighborhood','Chapel'
]) WITH ORDINALITY AS t(label, ordinality)
ON CONFLICT (kind, label) DO NOTHING;

INSERT INTO public.site_options (kind, label, sort_order)
SELECT 'equipment', label, ordinality
FROM unnest(ARRAY[
  'None — musician brings everything','Microphone and PA system','Power outlet access',
  'Music stand','Seating for the performer','Piano or keyboard on site'
]) WITH ORDINALITY AS t(label, ordinality)
ON CONFLICT (kind, label) DO NOTHING;

INSERT INTO public.site_options (kind, label, sort_order)
SELECT 'director_job_title', label, ordinality
FROM unnest(ARRAY[
  'Activities Director','Activities Coordinator','Life Enrichment Director','Executive Director',
  'Memory Care Director','Resident Services Director','Volunteer Coordinator','Other'
]) WITH ORDINALITY AS t(label, ordinality)
ON CONFLICT (kind, label) DO NOTHING;

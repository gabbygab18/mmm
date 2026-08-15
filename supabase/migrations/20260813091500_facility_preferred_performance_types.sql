-- Companion to 20260813090000: the Facility Profile mockup also shows
-- "Preferred Performance Types" (Solo/Duo/Small Group) for a facility —
-- distinct from a musician's own band_size_preference, this is what kind of
-- act the facility likes to host. No existing column for it.
ALTER TABLE public.centers
  ADD COLUMN IF NOT EXISTS preferred_performance_types text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.centers.preferred_performance_types IS 'Performance formats (Solo/Duo/Small group/...) this facility prefers to host — optional, facility-entered.';

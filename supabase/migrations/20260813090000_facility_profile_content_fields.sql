-- The new Facility Profile / Participating Facilities design (mockups,
-- Aug 2026) shows several fields no table had a column for: an "About this
-- Community" description, an established year, a community type (private/
-- public), a short "What Makes Us Special" bullet list, a community
-- testimonial quote, and the preferred music styles a facility likes to
-- host. Rather than fabricate that copy in the UI, these are real nullable
-- columns a facility fills in themselves (via Edit Profile) — the profile
-- page shows an honest "not added yet" state until they do.
ALTER TABLE public.centers
  ADD COLUMN IF NOT EXISTS about_description text,
  ADD COLUMN IF NOT EXISTS established_year integer,
  ADD COLUMN IF NOT EXISTS community_type text,
  ADD COLUMN IF NOT EXISTS highlights text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS testimonial_quote text,
  ADD COLUMN IF NOT EXISTS testimonial_author text,
  ADD COLUMN IF NOT EXISTS preferred_music_styles text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.centers.about_description IS 'Free-text "About this Community" shown on the facility profile page.';
COMMENT ON COLUMN public.centers.established_year IS 'Year the community was established — optional, facility-entered.';
COMMENT ON COLUMN public.centers.community_type IS 'e.g. "Private Community" / "Public Community" — optional, facility-entered.';
COMMENT ON COLUMN public.centers.highlights IS '"What Makes Us Special" bullet list — optional, facility-entered.';
COMMENT ON COLUMN public.centers.testimonial_quote IS '"Notes from the Community" quote — optional, facility-entered.';
COMMENT ON COLUMN public.centers.testimonial_author IS 'Attribution for testimonial_quote, e.g. "Activities Team".';
COMMENT ON COLUMN public.centers.preferred_music_styles IS 'Genres this facility prefers to host, drawn from the same GENRES list musicians pick from.';

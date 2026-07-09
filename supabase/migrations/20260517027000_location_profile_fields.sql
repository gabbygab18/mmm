-- Make center locations first-class public profiles.

ALTER TABLE public.center_locations
  ADD COLUMN IF NOT EXISTS resident_count INT,
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS username TEXT;

UPDATE public.center_locations cl
SET resident_count = c.resident_count
FROM public.centers c
WHERE c.id = cl.center_id
  AND cl.resident_count IS NULL;

UPDATE public.center_locations
SET username = LEFT(
  CASE
    WHEN LENGTH(BTRIM(REGEXP_REPLACE(LOWER(COALESCE(name, '')), '[^a-z0-9]+', '_', 'g'), '_')) > 0
      THEN BTRIM(REGEXP_REPLACE(LOWER(COALESCE(name, '')), '[^a-z0-9]+', '_', 'g'), '_')
      ELSE 'location'
  END,
  21
) || '_' || LEFT(REPLACE(id::text, '-', ''), 8)
WHERE username IS NULL;

UPDATE public.center_locations
SET profile_complete = (
  LENGTH(COALESCE(name, '')) > 0
  AND LENGTH(COALESCE(address, '')) > 0
  AND zip_code ~ '^[0-9]{5}$'
  AND resident_count IS NOT NULL
);

ALTER TABLE public.center_locations
  ADD CONSTRAINT center_locations_username_format_check
  CHECK (username ~ '^[a-z0-9_]{3,30}$');

ALTER TABLE public.center_locations
  ADD CONSTRAINT center_locations_resident_count_nonnegative_check
  CHECK (resident_count IS NULL OR resident_count >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_center_locations_username_unique ON public.center_locations (username);

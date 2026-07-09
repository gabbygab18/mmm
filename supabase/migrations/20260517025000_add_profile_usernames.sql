-- Add username slugs for public musician and center profile URLs.

ALTER TABLE public.musicians
  ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE public.centers
  ADD COLUMN IF NOT EXISTS username TEXT;

UPDATE public.musicians
SET username = LEFT(
  CASE
    WHEN LENGTH(BTRIM(REGEXP_REPLACE(LOWER(COALESCE(name, '')), '[^a-z0-9]+', '_', 'g'), '_')) > 0
      THEN BTRIM(REGEXP_REPLACE(LOWER(COALESCE(name, '')), '[^a-z0-9]+', '_', 'g'), '_')
      ELSE 'musician'
  END,
  21
) || '_' || LEFT(REPLACE(id::text, '-', ''), 8)
WHERE username IS NULL;

UPDATE public.centers
SET username = LEFT(
  CASE
    WHEN LENGTH(BTRIM(REGEXP_REPLACE(LOWER(COALESCE(name, '')), '[^a-z0-9]+', '_', 'g'), '_')) > 0
      THEN BTRIM(REGEXP_REPLACE(LOWER(COALESCE(name, '')), '[^a-z0-9]+', '_', 'g'), '_')
      ELSE 'center'
  END,
  21
) || '_' || LEFT(REPLACE(id::text, '-', ''), 8)
WHERE username IS NULL;

ALTER TABLE public.musicians
  ADD CONSTRAINT musicians_username_format_check
  CHECK (username ~ '^[a-z0-9_]{3,30}$');

ALTER TABLE public.centers
  ADD CONSTRAINT centers_username_format_check
  CHECK (username ~ '^[a-z0-9_]{3,30}$');

ALTER TABLE public.musicians
  ALTER COLUMN username SET NOT NULL;

ALTER TABLE public.centers
  ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_musicians_username_unique ON public.musicians (username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_centers_username_unique ON public.centers (username);

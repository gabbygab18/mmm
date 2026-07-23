-- ============================================================================
-- Registration data retention fix + split names + facility registration fields
--
-- Reported by the client (July 2026): "my registration data wasn't retained."
--
-- Cause: the on_auth_user_created trigger only wrote id / role / email into
-- public.users. Everything else the registration wizards collect lived in
-- auth.users.raw_user_meta_data->'registration' and was never copied into
-- musicians / centers / center_locations, so the dashboard and onboarding
-- screens loaded blank.
--
-- Fix: extend the bootstrap trigger to hydrate the profile rows from that
-- metadata, and add the columns the new facility wizard collects.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Split names (musician listings show "First L." publicly)
-- ---------------------------------------------------------------------------
ALTER TABLE musicians
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS last_name  VARCHAR(120);

-- Backfill from the existing single `name` column: everything before the last
-- space is the first name, the remainder is the surname.
UPDATE musicians
SET first_name = COALESCE(first_name, NULLIF(split_part(name, ' ', 1), '')),
    last_name  = COALESCE(
      last_name,
      NULLIF(substring(name FROM position(' ' IN name) + 1), '')
    )
WHERE first_name IS NULL OR last_name IS NULL;

-- Public-facing display name: "Maria S." — never the full surname.
CREATE OR REPLACE FUNCTION public.musician_display_name(
  p_first TEXT,
  p_last  TEXT,
  p_full  TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(NULLIF(TRIM(p_first), ''), '') <> ''
      THEN TRIM(p_first) ||
           CASE WHEN COALESCE(NULLIF(TRIM(p_last), ''), '') <> ''
                THEN ' ' || UPPER(LEFT(TRIM(p_last), 1)) || '.'
                ELSE '' END
    ELSE COALESCE(p_full, '')
  END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Facility registration fields
-- ---------------------------------------------------------------------------
ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS website                  TEXT,
  ADD COLUMN IF NOT EXISTS director_first_name      VARCHAR(120),
  ADD COLUMN IF NOT EXISTS director_last_name       VARCHAR(120),
  ADD COLUMN IF NOT EXISTS director_email           VARCHAR(255),
  ADD COLUMN IF NOT EXISTS director_phone           VARCHAR(20),
  ADD COLUMN IF NOT EXISTS director_job_title       VARCHAR(120),
  ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(40),
  ADD COLUMN IF NOT EXISTS preferred_days           TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS visit_frequency          VARCHAR(60),
  ADD COLUMN IF NOT EXISTS preferred_time           VARCHAR(80),
  ADD COLUMN IF NOT EXISTS performance_location     VARCHAR(80),
  ADD COLUMN IF NOT EXISTS preferred_length         VARCHAR(40),
  ADD COLUMN IF NOT EXISTS scheduling_notes         TEXT;

ALTER TABLE center_locations
  ADD COLUMN IF NOT EXISTS city  VARCHAR(120),
  ADD COLUMN IF NOT EXISTS state VARCHAR(60);

-- ---------------------------------------------------------------------------
-- 3. Bootstrap trigger — now hydrates the profile rows
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
  reg           JSONB;
  meta          JSONB;
  v_first       TEXT;
  v_last        TEXT;
  v_full        TEXT;
  v_center_id   UUID;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  reg  := COALESCE(meta->'registration', '{}'::jsonb);

  assigned_role := CASE
    WHEN meta->>'role' IN ('musician', 'center_coordinator', 'admin')
      THEN (meta->>'role')::user_role
    ELSE 'musician'::user_role
  END;

  v_first := NULLIF(TRIM(COALESCE(meta->>'first_name', '')), '');
  v_last  := NULLIF(TRIM(COALESCE(meta->>'last_name', '')), '');
  v_full  := NULLIF(TRIM(COALESCE(meta->>'full_name', '')), '');

  -- Fall back to splitting full_name when only the combined field was sent.
  IF v_first IS NULL AND v_full IS NOT NULL THEN
    v_first := NULLIF(split_part(v_full, ' ', 1), '');
    v_last  := NULLIF(substring(v_full FROM position(' ' IN v_full) + 1), '');
  END IF;

  IF v_full IS NULL THEN
    v_full := NULLIF(TRIM(CONCAT_WS(' ', v_first, v_last)), '');
  END IF;

  INSERT INTO public.users (id, role, email, phone)
  VALUES (
    NEW.id,
    assigned_role,
    NEW.email,
    NULLIF(reg->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET role       = EXCLUDED.role,
      email      = EXCLUDED.email,
      phone      = COALESCE(EXCLUDED.phone, public.users.phone),
      updated_at = CURRENT_TIMESTAMP;

  -- ---------------- Musician ----------------
  IF assigned_role = 'musician' THEN
    INSERT INTO public.musicians (
      user_id, name, first_name, last_name, bio, zip_code, phone,
      instruments, music_types, band_size_preference,
      travel_radius_miles, general_available_days, profile_complete
    )
    VALUES (
      NEW.id,
      COALESCE(v_full, NEW.email),
      v_first,
      v_last,
      NULLIF(reg->>'bio', ''),
      COALESCE(NULLIF(reg->>'zip_code', ''), '00000'),
      NULLIF(reg->>'phone', ''),
      CASE WHEN jsonb_typeof(reg->'instruments') = 'array'
           THEN ARRAY(SELECT jsonb_array_elements_text(reg->'instruments'))
           ELSE '{}'::text[] END,
      CASE WHEN jsonb_typeof(reg->'genres') = 'array'
           THEN ARRAY(SELECT jsonb_array_elements_text(reg->'genres'))
           ELSE '{}'::text[] END,
      NULLIF(reg->>'performance_type', ''),
      COALESCE(NULLIF(regexp_replace(COALESCE(reg->>'max_travel_distance', ''), '\D', '', 'g'), '')::INT, 15),
      CASE WHEN jsonb_typeof(reg->'preferred_days') = 'array'
           THEN ARRAY(SELECT jsonb_array_elements_text(reg->'preferred_days'))
           ELSE '{}'::text[] END,
      reg <> '{}'::jsonb
    )
    ON CONFLICT (user_id) DO UPDATE
    SET name       = COALESCE(EXCLUDED.name, public.musicians.name),
        first_name = COALESCE(EXCLUDED.first_name, public.musicians.first_name),
        last_name  = COALESCE(EXCLUDED.last_name, public.musicians.last_name),
        updated_at = CURRENT_TIMESTAMP;

  -- ---------------- Facility / center ----------------
  ELSIF assigned_role = 'center_coordinator' THEN
    INSERT INTO public.centers (
      user_id, name, phone, website,
      director_first_name, director_last_name, director_email, director_phone,
      director_job_title, preferred_contact_method,
      preferred_days, visit_frequency, preferred_time,
      performance_location, preferred_length, scheduling_notes,
      profile_complete
    )
    VALUES (
      NEW.id,
      COALESCE(NULLIF(reg->>'facility_name', ''), v_full, NEW.email),
      NULLIF(reg->>'phone', ''),
      NULLIF(reg->>'website', ''),
      NULLIF(reg->>'director_first_name', ''),
      NULLIF(reg->>'director_last_name', ''),
      NULLIF(reg->>'director_email', ''),
      NULLIF(reg->>'director_phone', ''),
      NULLIF(reg->>'director_job_title', ''),
      NULLIF(reg->>'preferred_contact_method', ''),
      CASE WHEN jsonb_typeof(reg->'preferred_days') = 'array'
           THEN ARRAY(SELECT jsonb_array_elements_text(reg->'preferred_days'))
           ELSE '{}'::text[] END,
      NULLIF(reg->>'visit_frequency', ''),
      NULLIF(reg->>'preferred_time', ''),
      NULLIF(reg->>'performance_location', ''),
      NULLIF(reg->>'preferred_length', ''),
      NULLIF(reg->>'scheduling_notes', ''),
      reg <> '{}'::jsonb
    )
    ON CONFLICT (user_id) DO UPDATE
    SET name       = COALESCE(EXCLUDED.name, public.centers.name),
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_center_id;

    -- The address from step 2 becomes the community's first location, which is
    -- what the matching and discovery functions actually search against.
    IF v_center_id IS NOT NULL AND NULLIF(reg->>'address', '') IS NOT NULL THEN
      INSERT INTO public.center_locations (center_id, name, address, city, state, zip_code, phone)
      SELECT
        v_center_id,
        COALESCE(NULLIF(reg->>'facility_name', ''), 'Main location'),
        reg->>'address',
        NULLIF(reg->>'city', ''),
        NULLIF(reg->>'state', ''),
        COALESCE(NULLIF(reg->>'zip_code', ''), '00000'),
        NULLIF(reg->>'phone', '')
      WHERE NOT EXISTS (
        SELECT 1 FROM public.center_locations WHERE center_id = v_center_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_bootstrap();

-- ---------------------------------------------------------------------------
-- 4. Backfill: recover answers from accounts that already registered
-- ---------------------------------------------------------------------------
UPDATE public.musicians m
SET first_name = COALESCE(m.first_name, NULLIF(au.raw_user_meta_data->>'first_name', '')),
    last_name  = COALESCE(m.last_name,  NULLIF(au.raw_user_meta_data->>'last_name', '')),
    bio        = COALESCE(m.bio,        NULLIF(au.raw_user_meta_data->'registration'->>'bio', '')),
    phone      = COALESCE(m.phone,      NULLIF(au.raw_user_meta_data->'registration'->>'phone', '')),
    updated_at = CURRENT_TIMESTAMP
FROM auth.users au
WHERE au.id = m.user_id
  AND au.raw_user_meta_data ? 'registration';

UPDATE public.centers c
SET website             = COALESCE(c.website,             NULLIF(au.raw_user_meta_data->'registration'->>'website', '')),
    director_first_name = COALESCE(c.director_first_name, NULLIF(au.raw_user_meta_data->'registration'->>'director_first_name', '')),
    director_last_name  = COALESCE(c.director_last_name,  NULLIF(au.raw_user_meta_data->'registration'->>'director_last_name', '')),
    director_email      = COALESCE(c.director_email,      NULLIF(au.raw_user_meta_data->'registration'->>'director_email', '')),
    director_phone      = COALESCE(c.director_phone,      NULLIF(au.raw_user_meta_data->'registration'->>'director_phone', '')),
    visit_frequency     = COALESCE(c.visit_frequency,     NULLIF(au.raw_user_meta_data->'registration'->>'visit_frequency', '')),
    preferred_time      = COALESCE(c.preferred_time,      NULLIF(au.raw_user_meta_data->'registration'->>'preferred_time', '')),
    updated_at          = CURRENT_TIMESTAMP
FROM auth.users au
WHERE au.id = c.user_id
  AND au.raw_user_meta_data ? 'registration';

COMMENT ON FUNCTION public.handle_auth_user_bootstrap() IS
  'Creates public.users and hydrates musicians/centers/center_locations from auth signup metadata. Added July 2026 to fix registration answers being discarded at signup.';

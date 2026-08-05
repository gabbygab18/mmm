-- Bug: the bootstrap trigger parsed max_travel_distance by stripping non-digit
-- characters. "Any distance" has no digits, so it collapsed to '' -> NULL and
-- fell back to the 15-mile default — selecting "Any distance" silently meant
-- 15 miles instead of nationwide. Same bug existed client-side in
-- musician-wizard.tsx (fixed separately) for the onboarding-completion path;
-- this covers the fresh /register/musician signup path, which writes
-- travel_radius_miles here instead.
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
  v_radius      INT;
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

  -- "Any distance" -> nationwide sentinel (5000mi, larger than any real US
  -- point-to-point distance). Anything else parses its digits as before.
  IF reg->>'max_travel_distance' ILIKE '%any%' THEN
    v_radius := 5000;
  ELSE
    v_radius := COALESCE(NULLIF(regexp_replace(COALESCE(reg->>'max_travel_distance', ''), '\D', '', 'g'), '')::INT, 15);
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
      v_radius,
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

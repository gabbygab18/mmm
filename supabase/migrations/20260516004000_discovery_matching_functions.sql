-- Discovery matching helpers for Sprint 2

CREATE OR REPLACE FUNCTION public.get_nearby_centers_for_musician(result_limit INTEGER DEFAULT 25)
RETURNS TABLE (
  center_id UUID,
  center_name VARCHAR,
  resident_count INTEGER,
  center_profile_image_url VARCHAR,
  location_id UUID,
  location_name VARCHAR,
  location_zip_code VARCHAR,
  supports_transport BOOLEAN,
  location_image_url VARCHAR,
  distance_miles NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_musician AS (
    SELECT
      m.id,
      m.zip_code,
      CASE
        WHEN m.willing_to_travel THEN COALESCE(m.travel_radius_miles, 0)
        ELSE 0
      END AS radius_miles
    FROM public.musicians m
    WHERE m.user_id = auth.uid()
    LIMIT 1
  )
  SELECT
    c.id,
    c.name,
    c.resident_count,
    c.profile_image_url,
    cl.id,
    cl.name,
    cl.zip_code,
    cl.supports_transport,
    cl.location_image_url,
    distance_lookup.distance_miles
  FROM current_musician cm
  JOIN public.center_locations cl ON TRUE
  JOIN public.centers c ON c.id = cl.center_id
  CROSS JOIN LATERAL (
    SELECT public.get_distance_miles(cm.zip_code, cl.zip_code) AS distance_miles
  ) AS distance_lookup
  WHERE c.approved = TRUE
    AND c.profile_complete = TRUE
    AND distance_lookup.distance_miles IS NOT NULL
    AND distance_lookup.distance_miles <= cm.radius_miles
  ORDER BY distance_lookup.distance_miles ASC, c.name ASC, cl.name ASC
  LIMIT COALESCE(result_limit, 25);
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_centers_for_musician(INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_nearby_musicians_for_center(target_location_id UUID, result_limit INTEGER DEFAULT 25)
RETURNS TABLE (
  musician_id UUID,
  musician_name VARCHAR,
  musician_zip_code VARCHAR,
  music_types TEXT[],
  instruments TEXT[],
  band_size_preference VARCHAR,
  compensation_preference VARCHAR,
  profile_image_url VARCHAR,
  general_available_days TEXT[],
  willing_to_travel BOOLEAN,
  has_own_transport BOOLEAN,
  distance_miles NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_location AS (
    SELECT cl.id, cl.zip_code
    FROM public.center_locations cl
    JOIN public.centers c ON c.id = cl.center_id
    WHERE cl.id = target_location_id
      AND c.user_id = auth.uid()
    LIMIT 1
  )
  SELECT
    m.id,
    m.name,
    m.zip_code,
    m.music_types,
    m.instruments,
    m.band_size_preference,
    m.compensation_preference,
    m.profile_image_url,
    m.general_available_days,
    m.willing_to_travel,
    m.has_own_transport,
    distance_lookup.distance_miles
  FROM current_location cl
  JOIN public.musicians m ON TRUE
  CROSS JOIN LATERAL (
    SELECT public.get_distance_miles(m.zip_code, cl.zip_code) AS distance_miles
  ) AS distance_lookup
  WHERE m.approved = TRUE
    AND m.profile_complete = TRUE
    AND distance_lookup.distance_miles IS NOT NULL
    AND distance_lookup.distance_miles <= CASE
      WHEN m.willing_to_travel THEN COALESCE(m.travel_radius_miles, 0)
      ELSE 0
    END
  ORDER BY distance_lookup.distance_miles ASC, m.name ASC
  LIMIT COALESCE(result_limit, 25);
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_musicians_for_center(UUID, INTEGER) TO authenticated;

-- Sprint 5: Quick distance expansion options for musician-side discovery

CREATE OR REPLACE FUNCTION public.get_nearby_centers_for_musician_with_expansion(
  result_limit INTEGER DEFAULT 100,
  radius_boost_miles INTEGER DEFAULT 0
)
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
    AND distance_lookup.distance_miles <= (cm.radius_miles + GREATEST(COALESCE(radius_boost_miles, 0), 0))
  ORDER BY distance_lookup.distance_miles ASC, c.name ASC, cl.name ASC
  LIMIT COALESCE(result_limit, 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_centers_for_musician_with_expansion(INTEGER, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_nearby_center_request_slots_for_musician_with_expansion(
  result_limit INTEGER DEFAULT 100,
  days_ahead INTEGER DEFAULT 60,
  radius_boost_miles INTEGER DEFAULT 0
)
RETURNS TABLE (
  center_id UUID,
  center_name VARCHAR,
  location_id UUID,
  location_name VARCHAR,
  location_zip_code VARCHAR,
  requested_date DATE,
  start_time TIME,
  end_time TIME,
  notes TEXT,
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
    cl.id,
    cl.name,
    cl.zip_code,
    crd.requested_date,
    crd.start_time,
    crd.end_time,
    crd.notes,
    distance_lookup.distance_miles
  FROM current_musician cm
  JOIN public.center_locations cl ON TRUE
  JOIN public.centers c ON c.id = cl.center_id
  JOIN public.center_request_dates crd ON crd.center_location_id = cl.id
  CROSS JOIN LATERAL (
    SELECT public.get_distance_miles(cm.zip_code, cl.zip_code) AS distance_miles
  ) AS distance_lookup
  WHERE c.approved = TRUE
    AND c.profile_complete = TRUE
    AND distance_lookup.distance_miles IS NOT NULL
    AND distance_lookup.distance_miles <= (cm.radius_miles + GREATEST(COALESCE(radius_boost_miles, 0), 0))
    AND crd.requested_date >= CURRENT_DATE
    AND crd.requested_date <= (CURRENT_DATE + COALESCE(days_ahead, 60))
  ORDER BY crd.requested_date ASC, crd.start_time ASC, distance_lookup.distance_miles ASC
  LIMIT COALESCE(result_limit, 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_center_request_slots_for_musician_with_expansion(INTEGER, INTEGER, INTEGER) TO authenticated;

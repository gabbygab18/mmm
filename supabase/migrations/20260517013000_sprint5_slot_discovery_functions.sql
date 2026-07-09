-- Sprint 5: Slot-based discovery helpers

CREATE OR REPLACE FUNCTION public.get_nearby_center_request_slots_for_musician(
  result_limit INTEGER DEFAULT 100,
  days_ahead INTEGER DEFAULT 60
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
    AND distance_lookup.distance_miles <= cm.radius_miles
    AND crd.requested_date >= CURRENT_DATE
    AND crd.requested_date <= (CURRENT_DATE + COALESCE(days_ahead, 60))
  ORDER BY crd.requested_date ASC, crd.start_time ASC, distance_lookup.distance_miles ASC
  LIMIT COALESCE(result_limit, 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_center_request_slots_for_musician(INTEGER, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_nearby_musician_availability_slots_for_center(
  target_location_id UUID,
  result_limit INTEGER DEFAULT 100,
  days_ahead INTEGER DEFAULT 60
)
RETURNS TABLE (
  musician_id UUID,
  musician_name VARCHAR,
  musician_zip_code VARCHAR,
  available_date DATE,
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
    mad.available_date,
    mad.start_time,
    mad.end_time,
    mad.notes,
    distance_lookup.distance_miles
  FROM current_location cl
  JOIN public.musicians m ON TRUE
  JOIN public.musician_availability_dates mad ON mad.musician_id = m.id
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
    AND mad.available_date >= CURRENT_DATE
    AND mad.available_date <= (CURRENT_DATE + COALESCE(days_ahead, 60))
  ORDER BY mad.available_date ASC, mad.start_time ASC, distance_lookup.distance_miles ASC
  LIMIT COALESCE(result_limit, 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_musician_availability_slots_for_center(UUID, INTEGER, INTEGER) TO authenticated;

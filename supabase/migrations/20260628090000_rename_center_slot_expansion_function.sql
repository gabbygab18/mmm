-- Fix function-name truncation (Postgres identifiers are limited to 63 chars)
-- Replace long RPC name with a shorter, stable one.

DROP FUNCTION IF EXISTS public.get_nearby_musician_availability_slots_for_center_with_expansion(UUID, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_nearby_musician_slots_for_center_with_expansion(
  target_location_id UUID,
  result_limit INTEGER DEFAULT 100,
  days_ahead INTEGER DEFAULT 60,
  radius_boost_miles INTEGER DEFAULT 0
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
    AND distance_lookup.distance_miles <= (
      CASE
        WHEN m.willing_to_travel THEN COALESCE(m.travel_radius_miles, 0)
        ELSE 0
      END + GREATEST(COALESCE(radius_boost_miles, 0), 0)
    )
    AND mad.available_date >= CURRENT_DATE
    AND mad.available_date <= (CURRENT_DATE + COALESCE(days_ahead, 60))
  ORDER BY mad.available_date ASC, mad.start_time ASC, distance_lookup.distance_miles ASC
  LIMIT COALESCE(result_limit, 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_musician_slots_for_center_with_expansion(UUID, INTEGER, INTEGER, INTEGER) TO authenticated;

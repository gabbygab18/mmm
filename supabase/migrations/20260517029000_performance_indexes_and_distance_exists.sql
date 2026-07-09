-- Performance pass: add high-value composite indexes and optimize distance helper.

CREATE INDEX IF NOT EXISTS idx_musicians_approved_profile_complete
  ON public.musicians (approved, profile_complete);

CREATE INDEX IF NOT EXISTS idx_centers_approved_profile_complete
  ON public.centers (approved, profile_complete);

CREATE INDEX IF NOT EXISTS idx_requests_status_requested_date
  ON public.requests (status, requested_date);

CREATE INDEX IF NOT EXISTS idx_requests_musician_status_created
  ON public.requests (musician_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_requests_center_location_status_created
  ON public.requests (center_location_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_musician_availability_musician_date_time
  ON public.musician_availability_dates (musician_id, available_date, start_time);

CREATE INDEX IF NOT EXISTS idx_request_time_proposals_request_status_created
  ON public.request_time_proposals (request_id, proposal_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_center_request_dates_location_date_time
  ON public.center_request_dates (center_location_id, requested_date, start_time);

CREATE INDEX IF NOT EXISTS idx_center_locations_center_zip
  ON public.center_locations (center_id, zip_code);

CREATE INDEX IF NOT EXISTS idx_alerts_user_dismissed_created
  ON public.alerts (user_id, dismissed, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_distance_miles(zip1 TEXT, zip2 TEXT)
RETURNS NUMERIC AS $$
DECLARE
  lat1 NUMERIC;
  lon1 NUMERIC;
  lat2 NUMERIC;
  lon2 NUMERIC;
  distance NUMERIC;
BEGIN
  IF EXISTS (SELECT 1 FROM public.zip_centroids z WHERE z.zip_code = zip1) THEN
    SELECT z.latitude, z.longitude INTO lat1, lon1
    FROM public.zip_centroids z
    WHERE z.zip_code = zip1;
  ELSE
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.zip_centroids z WHERE z.zip_code = zip2) THEN
    SELECT z.latitude, z.longitude INTO lat2, lon2
    FROM public.zip_centroids z
    WHERE z.zip_code = zip2;
  ELSE
    RETURN NULL;
  END IF;

  distance := 3958.8 * acos(
    LEAST(
      1.0,
      GREATEST(
        -1.0,
        cos(radians(lat1::float8)) * cos(radians(lat2::float8)) *
        cos(radians((lon2 - lon1)::float8)) +
        sin(radians(lat1::float8)) * sin(radians(lat2::float8))
      )
    )
  );

  RETURN ROUND(distance, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Sprint 2 foundation: ZIP centroid lookup + distance function contract

-- Canonical ZIP centroid source table for radius matching.
-- Data can be loaded later from a vetted centroid dataset.
CREATE TABLE IF NOT EXISTS public.zip_centroids (
  zip_code VARCHAR(5) PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.zip_centroids ENABLE ROW LEVEL SECURITY;

-- Public read access for matching queries.
DROP POLICY IF EXISTS zip_centroids_select_all ON public.zip_centroids;
CREATE POLICY zip_centroids_select_all
  ON public.zip_centroids
  FOR SELECT
  USING (true);

GRANT SELECT ON public.zip_centroids TO authenticated;

-- Returns great-circle distance in miles between two ZIP codes.
-- Returns NULL when either ZIP is missing from zip_centroids.
CREATE OR REPLACE FUNCTION public.get_distance_miles(zip1 VARCHAR, zip2 VARCHAR)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
AS $$
  WITH z1 AS (
    SELECT latitude AS lat1, longitude AS lon1
    FROM public.zip_centroids
    WHERE zip_code = zip1
  ),
  z2 AS (
    SELECT latitude AS lat2, longitude AS lon2
    FROM public.zip_centroids
    WHERE zip_code = zip2
  )
  SELECT
    CASE
      WHEN (SELECT COUNT(*) FROM z1) = 0 OR (SELECT COUNT(*) FROM z2) = 0 THEN NULL
      ELSE ROUND(
        (
          3958.7613 * ACOS(
            LEAST(
              1,
              GREATEST(
                -1,
                SIN(RADIANS((SELECT lat1 FROM z1))) * SIN(RADIANS((SELECT lat2 FROM z2))) +
                COS(RADIANS((SELECT lat1 FROM z1))) * COS(RADIANS((SELECT lat2 FROM z2))) *
                COS(RADIANS((SELECT lon2 FROM z2) - (SELECT lon1 FROM z1)))
              )
            )
          )
        )::NUMERIC,
        2
      )
    END;
$$;

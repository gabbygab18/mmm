-- Username availability for public location profile slugs.

CREATE OR REPLACE FUNCTION public.is_location_username_available(
  p_username TEXT,
  p_exclude_location_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
BEGIN
  v_username := LOWER(COALESCE(p_username, ''));

  IF v_username !~ '^[a-z0-9_]{3,30}$' THEN
    RETURN FALSE;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.center_locations cl
    WHERE cl.username = v_username
      AND (p_exclude_location_id IS NULL OR cl.id <> p_exclude_location_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_location_username_available(TEXT, UUID) TO authenticated;

-- Provide a reliable username availability check for onboarding.

CREATE OR REPLACE FUNCTION public.is_profile_username_available(
  p_username TEXT,
  p_profile_type TEXT,
  p_exclude_user_id UUID DEFAULT auth.uid()
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

  IF p_profile_type = 'musician' THEN
    RETURN NOT EXISTS (
      SELECT 1
      FROM public.musicians m
      WHERE m.username = v_username
        AND (p_exclude_user_id IS NULL OR m.user_id <> p_exclude_user_id)
    );
  ELSIF p_profile_type = 'center' THEN
    RETURN NOT EXISTS (
      SELECT 1
      FROM public.centers c
      WHERE c.username = v_username
        AND (p_exclude_user_id IS NULL OR c.user_id <> p_exclude_user_id)
    );
  END IF;

  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_profile_username_available(TEXT, TEXT, UUID) TO authenticated;

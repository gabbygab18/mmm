-- Auto-create and maintain public.users rows from auth.users
-- Needed for role-aware RLS queries in the application.

CREATE OR REPLACE FUNCTION public.handle_auth_user_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role user_role;
BEGIN
  assigned_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('musician', 'center_coordinator', 'admin')
      THEN (NEW.raw_user_meta_data->>'role')::user_role
    ELSE 'musician'::user_role
  END;

  INSERT INTO public.users (id, role, email)
  VALUES (NEW.id, assigned_role, NEW.email)
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      email = EXCLUDED.email,
      updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_bootstrap();

-- Backfill any existing auth users missing in public.users.
INSERT INTO public.users (id, role, email)
SELECT au.id, 'musician'::user_role, au.email
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

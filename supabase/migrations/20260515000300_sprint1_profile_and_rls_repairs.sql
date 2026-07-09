-- Sprint 1 profile and RLS repairs
-- 1) Add missing musician general availability field
-- 2) Fix users-table admin policy recursion with a security-definer helper
-- 3) Ensure authenticated role has table privileges required for RLS to apply

ALTER TABLE public.musicians
  ADD COLUMN IF NOT EXISTS general_available_days TEXT[] DEFAULT '{}'::text[];

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

DROP POLICY IF EXISTS users_admin_view_all ON public.users;
DROP POLICY IF EXISTS users_admin_update_all ON public.users;

CREATE POLICY users_admin_view_all
  ON public.users
  FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY users_admin_update_all
  ON public.users
  FOR UPDATE
  USING (public.get_my_role() = 'admin');

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.musicians TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.centers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.center_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.musician_availability_dates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.center_request_dates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.request_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications_log TO authenticated;

-- Harden admin visibility/update policies on musicians, centers, and
-- center_locations to use the security-definer helper public.get_my_role(),
-- matching the users-table fix in 20260515000300_sprint1_profile_and_rls_repairs.
--
-- The original policies used an inline subquery:
--   (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
-- That subquery is evaluated under RLS on public.users for the `authenticated`
-- role and can resolve to no row, so admin reads silently return zero rows
-- (e.g. the "Pending Musicians" dashboard count showing 0 while an unapproved
-- musician row exists). get_my_role() is SECURITY DEFINER and reads the role
-- without tripping RLS, so it evaluates reliably for admins.

-- ── MUSICIANS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "musicians_admin_view_all" ON public.musicians;
CREATE POLICY "musicians_admin_view_all"
  ON public.musicians
  FOR SELECT
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "musicians_admin_update_all" ON public.musicians;
CREATE POLICY "musicians_admin_update_all"
  ON public.musicians
  FOR UPDATE
  USING (public.get_my_role() = 'admin');

-- ── CENTERS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "centers_admin_view_all" ON public.centers;
CREATE POLICY "centers_admin_view_all"
  ON public.centers
  FOR SELECT
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "centers_admin_update_all" ON public.centers;
CREATE POLICY "centers_admin_update_all"
  ON public.centers
  FOR UPDATE
  USING (public.get_my_role() = 'admin');

-- ── CENTER LOCATIONS ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "center_locations_admin_view_all" ON public.center_locations;
CREATE POLICY "center_locations_admin_view_all"
  ON public.center_locations
  FOR SELECT
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "center_locations_admin_update_all" ON public.center_locations;
CREATE POLICY "center_locations_admin_update_all"
  ON public.center_locations
  FOR UPDATE
  USING (public.get_my_role() = 'admin');

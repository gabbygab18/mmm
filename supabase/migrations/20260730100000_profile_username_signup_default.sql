-- ============================================================================
-- Fix: "Database error saving new user" on registration (facility and musician)
--
-- Reported by the client (30 July 2026) on /register/facility.
--
-- Cause: 20260723090000 taught public.handle_auth_user_bootstrap() to create the
-- musicians / centers row at signup, but its INSERTs never set `username` —
-- and 20260517026000 had made that column NOT NULL (no default) with a format
-- CHECK and a unique index. So every signup raised
--     sqlstate 23502: null value in column "username"
-- inside the auth trigger, which Supabase Auth surfaces to the browser as the
-- generic "Database error saving new user". Verified against this database with
-- a rolled-back auth.users insert: it failed for BOTH roles, table=centers /
-- musicians, column=username.
--
-- Fix: give the column a provisional unique handle so the trigger's INSERT is
-- valid. Both onboarding wizards already ask for a real username (with the
-- availability RPC) and overwrite this on save, so it is only ever a placeholder
-- between signup and profile setup.
--
-- Shape: 'u_' + 12 hex chars — 14 characters, which satisfies the existing
-- CHECK (username ~ '^[a-z0-9_]{3,30}$'), and random enough that
-- idx_{musicians,centers}_username_unique will not collide in practice.
-- Deliberately not derived from the person's or facility's name: an auto-derived
-- handle would squat a name the real owner may want to claim later.
-- ============================================================================

ALTER TABLE public.musicians
  ALTER COLUMN username SET DEFAULT ('u_' || substr(md5(gen_random_uuid()::text), 1, 12));

ALTER TABLE public.centers
  ALTER COLUMN username SET DEFAULT ('u_' || substr(md5(gen_random_uuid()::text), 1, 12));

COMMENT ON COLUMN public.musicians.username IS
  'Public profile handle. Chosen during onboarding; defaults to a provisional u_<hex> value so the signup trigger can insert the row.';

COMMENT ON COLUMN public.centers.username IS
  'Public profile handle. Chosen during onboarding; defaults to a provisional u_<hex> value so the signup trigger can insert the row.';

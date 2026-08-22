-- Follow-up to 20260822090000: actually take phone away from authenticated.
--
-- The previous migration issued `revoke select (phone)` while a table-level
-- `grant select` on public.musicians was still in force for anon/authenticated.
-- A column-level revoke cannot punch a hole in a table-wide grant — the
-- table-level privilege keeps satisfying the check, so phone stayed readable
-- (verified with has_column_privilege after that push).
--
-- The table-level grant has to be dropped first; the per-column grant then
-- becomes the only thing standing, which is what actually excludes phone.

revoke select on public.musicians from anon, authenticated;

-- Re-grant every column except phone. Listing them is unavoidable: Postgres
-- has no "all columns except" form, and re-granting at table level would put
-- us straight back where we started.
--
-- NOTE for future schema changes: a column added to this table after this
-- migration is NOT readable by anon/authenticated until it is added to a grant
-- like this one. That is the safe default (new columns are private until
-- deliberately exposed), but it does mean new public fields need a matching
-- grant in their own migration.
grant select (
  id, user_id, name, first_name, last_name, username, bio, zip_code,
  music_types, instruments, band_size_preference, compensation_preference,
  willing_to_travel, travel_radius_miles, has_own_transport,
  profile_image_url, profile_complete, approved, created_at, updated_at,
  general_available_days, youtube_channel_url, spotify_url, soundcloud_url,
  website_url, unavailable_dates, deleted_at
) on public.musicians to anon, authenticated;

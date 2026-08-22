-- Booking conflicts, musician unavailable dates, external music links, and
-- phone privacy.
--
-- Four related gaps this closes:
--
-- 1. Nothing anywhere checked for double-booking. A musician could accept two
--    overlapping requests, and a facility could request a slot the musician
--    had already committed to elsewhere.
-- 2. "Unavailable dates" from the Edit Profile calendar were written to
--    auth.users.raw_user_meta_data, which no booking query can reach — so the
--    dates a musician explicitly blocked out were invisible to the very flow
--    they exist to constrain.
-- 3. Musicians had a single youtube_channel_url and no other way to share
--    their music.
-- 4. musicians.phone was readable by every authenticated user: the
--    `musicians_view_approved` RLS policy grants the whole row, so any signed-in
--    account could read every approved musician's personal number straight off
--    the API, even though the UI only ever shows it to a booked counterparty.

-- ---------------------------------------------------------------------------
-- 1. Unavailable dates as a real column
-- ---------------------------------------------------------------------------

alter table public.musicians
  add column if not exists unavailable_dates date[] not null default '{}';

comment on column public.musicians.unavailable_dates is
  'Dates the musician has blocked out. Was previously kept in auth user metadata, which booking queries could not read.';

-- Backfill from the auth metadata the Edit Profile form had been writing to,
-- so musicians who already picked dates do not silently lose them. Entries
-- that are not parseable as dates are skipped rather than failing the migration.
update public.musicians m
set unavailable_dates = coalesce(backfill.dates, '{}')
from (
  select
    u.id as user_id,
    array_agg(d.value::date order by d.value::date) as dates
  from auth.users u
  cross join lateral jsonb_array_elements_text(
    coalesce(u.raw_user_meta_data -> 'registration' -> 'unavailable_dates', '[]'::jsonb)
  ) as d(value)
  where d.value ~ '^\d{4}-\d{2}-\d{2}$'
  group by u.id
) as backfill
where m.user_id = backfill.user_id
  and m.unavailable_dates = '{}';

-- ---------------------------------------------------------------------------
-- 2. External music links
-- ---------------------------------------------------------------------------

alter table public.musicians
  add column if not exists spotify_url text,
  add column if not exists soundcloud_url text,
  add column if not exists website_url text;

comment on column public.musicians.spotify_url is 'Optional external link shown on the public musician profile.';

-- ---------------------------------------------------------------------------
-- 3. Booking conflict detection
-- ---------------------------------------------------------------------------

-- Returns the musician's already-committed time windows that overlap the
-- proposed one. Deliberately free/busy only: it reports the times but never
-- which facility booked them, so a facility checking availability cannot
-- enumerate a musician's other engagements.
--
-- security definer because the caller (a facility coordinator) has no RLS
-- access to requests belonging to other centers — which is exactly the set
-- that needs checking.
create or replace function public.find_booking_conflicts(
  p_musician_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_request_id uuid default null
)
returns table (
  conflict_start_time time,
  conflict_end_time time
)
language sql
stable
security definer
set search_path = public
as $$
  select r.requested_start_time, r.requested_end_time
  from public.requests r
  where r.musician_id = p_musician_id
    and r.requested_date = p_date
    and r.status = 'accepted'
    and (p_exclude_request_id is null or r.id <> p_exclude_request_id)
    and r.requested_start_time is not null
    and r.requested_end_time is not null
    -- Half-open overlap: touching endpoints (10-11 and 11-12) do not collide.
    and p_start_time < r.requested_end_time
    and p_end_time > r.requested_start_time
  order by r.requested_start_time;
$$;

revoke all on function public.find_booking_conflicts(uuid, date, time, time, uuid) from public;
grant execute on function public.find_booking_conflicts(uuid, date, time, time, uuid) to authenticated;

-- Whether a musician has blocked the date out entirely. Separate from the
-- overlap check because it is a different kind of "no" — the whole day is
-- off, not just a colliding window.
create or replace function public.is_musician_date_blocked(
  p_musician_id uuid,
  p_date date
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.musicians m
    where m.id = p_musician_id
      and p_date = any(m.unavailable_dates)
  );
$$;

revoke all on function public.is_musician_date_blocked(uuid, date) from public;
grant execute on function public.is_musician_date_blocked(uuid, date) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Phone privacy
-- ---------------------------------------------------------------------------

-- Column-level revoke: RLS decides which ROWS are visible, and
-- `musicians_view_approved` intentionally makes every approved musician's row
-- visible platform-wide (that is what powers discovery). Column privileges are
-- the only lever that can carve one field back out of that.
--
-- Server code that legitimately needs the number — the Scheduled Events page,
-- which shows it only to the counterparty on an accepted booking — reads it
-- through the service-role client, which is not subject to these grants.
revoke select (phone) on public.musicians from anon, authenticated;

-- Everything except phone stays readable exactly as before. Postgres has no
-- "all columns except" grant, so the remaining set is listed explicitly; any
-- column added later is readable by default via the table-level grant that
-- still stands for them.
grant select (
  id, user_id, name, first_name, last_name, username, bio, zip_code,
  music_types, instruments, band_size_preference, compensation_preference,
  willing_to_travel, travel_radius_miles, has_own_transport,
  profile_image_url, profile_complete, approved, created_at, updated_at,
  general_available_days, youtube_channel_url, spotify_url, soundcloud_url,
  website_url, unavailable_dates, deleted_at
) on public.musicians to authenticated;

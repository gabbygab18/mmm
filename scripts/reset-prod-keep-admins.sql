-- ============================================================================
-- PRODUCTION RESET — keeps ONLY the two admin accounts.
--
-- ⚠️  IRREVERSIBLE. Deletes 29 of 31 accounts and every request, booking,
--     alert, log, and contact inquiry in the database.
--
-- Backup taken before this was written:
--     backups/prod-20260822-1811/   (14 tables + auth.users, counts verified)
--     NOTE: that export does NOT contain password hashes. Restoring from it
--     recreates accounts and data but every user would need a password reset.
--     For a true full restore use Supabase Dashboard → Database → Backups.
--
-- Accounts preserved:
--     bde6e92d-c878-4732-a2b3-cab157b7a7d7   cpe.villanueva.gabrielandrei@gmail.com
--     d270baaa-fffd-4bac-b1bf-ea8b54dde940   admin@margaretsmemorycaremusic.org
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → paste → Run.
--
-- ORDER MATTERS. Three foreign keys into public.users are ON DELETE RESTRICT
-- (request_status_history.changed_by_user_id,
--  request_time_proposals.proposed_by_user_id,
--  moderation_flags.created_by_admin_user_id), so those rows must go before
-- any user row can be removed. Deleting auth.users last is enough for the
-- rest: public.users cascades from auth.users, and musicians / centers /
-- alerts / notifications_log all cascade from public.users.
--
-- Wrapped in a transaction: if any statement fails, nothing is deleted.
-- ============================================================================

begin;

-- 1. Request graph. Must precede users because of the RESTRICT keys above.
delete from request_status_history;
delete from request_time_proposals;
delete from requests;

-- 2. Per-user records that would otherwise cascade unpredictably.
delete from alerts;
delete from notifications_log;
delete from musician_availability_dates;
delete from center_request_dates;
delete from moderation_flags;

-- 3. Website contact-form submissions (7 rows). These are real inbound
--    inquiries, not test data — remove this line if you want to keep them.
delete from contact_inquiries;

-- 4. Profiles. center_locations cascades from centers, but deleting it
--    explicitly keeps the intent obvious.
delete from musicians;
delete from center_locations;
delete from centers;

-- 5. Accounts. Cascades into public.users and anything still hanging off it.
delete from auth.users
where id not in (
  'bde6e92d-c878-4732-a2b3-cab157b7a7d7',
  'd270baaa-fffd-4bac-b1bf-ea8b54dde940'
);

commit;

-- ============================================================================
-- Verify afterwards — expect 2 users (both admin) and 0 everywhere else:
--
--   select 'users' t, count(*) n from users
--   union all select 'auth.users', count(*) from auth.users
--   union all select 'musicians', count(*) from musicians
--   union all select 'centers', count(*) from centers
--   union all select 'requests', count(*) from requests
--   union all select 'alerts', count(*) from alerts;
-- ============================================================================

-- S0.6 RLS smoke test helper script
-- Purpose: quickly validate role isolation expectations after baseline schema + RLS setup.
-- Run each block manually in Supabase SQL Editor and verify expected results.

-- -----------------------------------------------------------------------------
-- 0) Prep notes
-- -----------------------------------------------------------------------------
-- This script does not impersonate auth users. It provides verification queries
-- and expected outcomes after you create 3 auth accounts and seed linked rows.

-- Required auth accounts (Authentication > Users):
-- 1. musician_test@example.com
-- 2. center_test@example.com
-- 3. admin_test@example.com

-- -----------------------------------------------------------------------------
-- 1) Create auth users first, then seed app-level role rows
-- -----------------------------------------------------------------------------
-- In Supabase Dashboard -> Authentication -> Users, create these 3 users first:
-- 1. musician_test@example.com
-- 2. center_test@example.com
-- 3. admin_test@example.com

-- Optional check (run first):
SELECT id, email
FROM auth.users
WHERE email IN ('musician_test@example.com', 'center_test@example.com', 'admin_test@example.com')
ORDER BY email;

-- Seed public users table from auth.users (no manual UUID editing needed):
INSERT INTO users (id, role, email)
SELECT id, 'musician'::user_role, email
FROM auth.users
WHERE email = 'musician_test@example.com'
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email;

INSERT INTO users (id, role, email)
SELECT id, 'center_coordinator'::user_role, email
FROM auth.users
WHERE email = 'center_test@example.com'
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email;

INSERT INTO users (id, role, email)
SELECT id, 'admin'::user_role, email
FROM auth.users
WHERE email = 'admin_test@example.com'
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email;

-- -----------------------------------------------------------------------------
-- 2) Seed one musician and one center with one location
-- -----------------------------------------------------------------------------
INSERT INTO musicians (user_id, name, zip_code, approved, profile_complete)
SELECT u.id, 'Test Musician', '10001', TRUE, TRUE
FROM users u
WHERE u.email = 'musician_test@example.com'
ON CONFLICT (user_id) DO UPDATE
SET
  name = EXCLUDED.name,
  zip_code = EXCLUDED.zip_code,
  approved = EXCLUDED.approved,
  profile_complete = EXCLUDED.profile_complete;

INSERT INTO centers (user_id, name, approved, profile_complete)
SELECT u.id, 'Test Memory Care Center', TRUE, TRUE
FROM users u
WHERE u.email = 'center_test@example.com'
ON CONFLICT (user_id) DO UPDATE
SET
  name = EXCLUDED.name,
  approved = EXCLUDED.approved,
  profile_complete = EXCLUDED.profile_complete;

INSERT INTO center_locations (center_id, name, address, zip_code)
SELECT c.id, 'Main Campus', '123 Test Ave', '10002'
FROM centers c
JOIN users u ON u.id = c.user_id
WHERE u.email = 'center_test@example.com'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3) Validate public discovery shape (approved-only records visible)
-- -----------------------------------------------------------------------------
SELECT id, name, approved FROM musicians ORDER BY created_at DESC LIMIT 5;
SELECT id, name, approved FROM centers ORDER BY created_at DESC LIMIT 5;

-- Expected:
-- - Approved rows return.
-- - Unapproved rows are hidden from anon/authenticated non-owner users.

-- -----------------------------------------------------------------------------
-- 4) Validate center location join integrity
-- -----------------------------------------------------------------------------
SELECT cl.id, cl.name AS location_name, c.name AS center_name
FROM center_locations cl
JOIN centers c ON c.id = cl.center_id
ORDER BY cl.created_at DESC
LIMIT 5;

-- Expected:
-- - Location rows map to the right center.

-- -----------------------------------------------------------------------------
-- 5) Validate request workflow baseline integrity
-- -----------------------------------------------------------------------------
-- Create one synthetic request (as service role in SQL editor)
WITH m AS (
  SELECT id AS musician_id FROM musicians ORDER BY created_at DESC LIMIT 1
), cl AS (
  SELECT id AS center_location_id FROM center_locations ORDER BY created_at DESC LIMIT 1
)
INSERT INTO requests (musician_id, center_location_id, requested_date, status, initiator_role, notes)
SELECT m.musician_id, cl.center_location_id, CURRENT_DATE + INTERVAL '7 days', 'initiated', 'center_coordinator', 'S0.6 smoke test request'
FROM m, cl
RETURNING id, musician_id, center_location_id, requested_date, status;

-- Expected:
-- - Insert succeeds.
-- - One request row returned.

-- -----------------------------------------------------------------------------
-- 6) Validate request history insert path
-- -----------------------------------------------------------------------------
WITH r AS (
  SELECT id AS request_id FROM requests ORDER BY created_at DESC LIMIT 1
), u AS (
  SELECT id AS user_id FROM users WHERE role = 'admin' ORDER BY created_at DESC LIMIT 1
)
INSERT INTO request_status_history (request_id, old_status, new_status, changed_by_user_id, reason)
SELECT r.request_id, 'initiated', 'matched', u.user_id, 'S0.6 status transition test'
FROM r, u
RETURNING id, request_id, old_status, new_status, changed_by_user_id;

-- Expected:
-- - Insert succeeds.
-- - History row returned.

-- -----------------------------------------------------------------------------
-- 7) Validate alerts + notifications log baseline
-- -----------------------------------------------------------------------------
WITH target_user AS (
  SELECT id AS user_id, email
  FROM users
  WHERE role = 'musician'
  ORDER BY created_at DESC
  LIMIT 1
), target_request AS (
  SELECT id AS request_id
  FROM requests
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO alerts (user_id, alert_type, title, message, related_request_id)
SELECT target_user.user_id, 'new_match', 'You have a new match', 'Smoke test alert', target_request.request_id
FROM target_user, target_request
RETURNING id, user_id, alert_type, read, dismissed;

WITH target_user AS (
  SELECT id AS user_id, email
  FROM users
  WHERE role = 'musician'
  ORDER BY created_at DESC
  LIMIT 1
), target_request AS (
  SELECT id AS request_id
  FROM requests
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO notifications_log (user_id, email_to, alert_type, subject, body, related_request_id, bounce_status)
SELECT target_user.user_id, target_user.email, 'request_status_change', 'Smoke test notification', 'Request moved to matched', target_request.request_id, 'sent'
FROM target_user, target_request
RETURNING id, user_id, email_to, alert_type, sent_at, bounce_status;

-- Expected:
-- - Both inserts succeed.

-- -----------------------------------------------------------------------------
-- 8) Quick health counts
-- -----------------------------------------------------------------------------
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'musicians', COUNT(*) FROM musicians
UNION ALL SELECT 'centers', COUNT(*) FROM centers
UNION ALL SELECT 'center_locations', COUNT(*) FROM center_locations
UNION ALL SELECT 'requests', COUNT(*) FROM requests
UNION ALL SELECT 'request_status_history', COUNT(*) FROM request_status_history
UNION ALL SELECT 'alerts', COUNT(*) FROM alerts
UNION ALL SELECT 'notifications_log', COUNT(*) FROM notifications_log
ORDER BY table_name;

-- -----------------------------------------------------------------------------
-- 9) Optional cleanup
-- -----------------------------------------------------------------------------
-- DELETE FROM notifications_log WHERE subject = 'Smoke test notification';
-- DELETE FROM alerts WHERE title = 'You have a new match';
-- DELETE FROM request_status_history WHERE reason = 'S0.6 status transition test';
-- DELETE FROM requests WHERE notes = 'S0.6 smoke test request';
-- DELETE FROM center_locations WHERE name = 'Main Campus' AND address = '123 Test Ave';
-- DELETE FROM centers WHERE name = 'Test Memory Care Center';
-- DELETE FROM musicians WHERE name = 'Test Musician';
-- DELETE FROM users WHERE email IN ('musician_test@example.com', 'center_test@example.com', 'admin_test@example.com');

-- Sprint 9: Notification deduplication + throttle smoke tests
-- Goal: detect duplicate alerts and throttle violations before launch.

-- Test 1: Core notification plumbing exists
SELECT 'Test 1: create_alert_for_user RPC exists' AS test_name,
       CASE
         WHEN EXISTS (
           SELECT 1
           FROM information_schema.routines
           WHERE routine_schema = 'public'
             AND routine_name = 'create_alert_for_user'
         ) THEN 'PASS'
         ELSE 'FAIL'
       END AS result;

SELECT 'Test 2: request/proposal alert triggers exist' AS test_name,
       CASE
         WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'request_initiated_trigger')
          AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'proposal_suggested_trigger')
         THEN 'PASS'
         ELSE 'FAIL'
       END AS result;

-- Test 3: Duplicate alert rows for same logical event (same user + type + request in a 10s window)
-- A non-zero value indicates likely duplicate notifications from overlapping paths.
WITH grouped AS (
  SELECT
    user_id,
    alert_type,
    related_request_id,
    FLOOR(EXTRACT(EPOCH FROM created_at) / 10) AS ten_second_bucket,
    COUNT(*) AS row_count
  FROM alerts
  WHERE related_request_id IS NOT NULL
  GROUP BY user_id, alert_type, related_request_id, FLOOR(EXTRACT(EPOCH FROM created_at) / 10)
), violations AS (
  SELECT *
  FROM grouped
  WHERE row_count > 1
)
SELECT 'Test 3: Duplicate alerts in 10s bucket' AS test_name,
       COUNT(*) AS duplicate_group_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM violations;

-- Test 4: Email throttle violation check (same user + alert_type more than once within any rolling 24h)
-- A non-zero value indicates throttle logic is being bypassed.
WITH pairs AS (
  SELECT
    a.user_id,
    a.alert_type,
    a.sent_at AS first_sent_at,
    b.sent_at AS second_sent_at
  FROM notifications_log a
  JOIN notifications_log b
    ON b.user_id = a.user_id
   AND b.alert_type = a.alert_type
   AND b.id <> a.id
   AND b.sent_at > a.sent_at
   AND b.sent_at <= a.sent_at + INTERVAL '24 hours'
)
SELECT 'Test 4: 24h throttle violations' AS test_name,
       COUNT(*) AS violating_pairs,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM pairs;

-- Test 5: At-most-one email per day summary (calendar-day view, easier manual audit)
WITH day_counts AS (
  SELECT
    user_id,
    alert_type,
    DATE(sent_at) AS sent_day,
    COUNT(*) AS sent_count
  FROM notifications_log
  GROUP BY user_id, alert_type, DATE(sent_at)
), violations AS (
  SELECT *
  FROM day_counts
  WHERE sent_count > 1
)
SELECT 'Test 5: >1 same-type email in single day' AS test_name,
       COUNT(*) AS violating_user_days,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM violations;

-- Test 6: Alerts table has dedupe-friendly index coverage for bell and history views
SELECT 'Test 6: alerts performance index exists' AS test_name,
       CASE
         WHEN EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'idx_alerts_user_dismissed_created'
         ) THEN 'PASS'
         ELSE 'FAIL'
       END AS result;

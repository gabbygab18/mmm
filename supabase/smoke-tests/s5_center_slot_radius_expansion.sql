-- Sprint 5 smoke test: center-side radius expansion for musician slot discovery
-- This file is written for Supabase SQL Editor (plain SQL, no psql :variables).
--
-- Before running, replace the UUID placeholders below with real IDs from your data.
-- center_location_id: a location owned by your center_coordinator test user
-- near_musician_id/farther_musician_id: optional for targeted checks

-- 1) Baseline query (no boost)
-- Expectation: includes nearby musician slots that satisfy musician travel settings.
WITH params AS (
  SELECT
    '00000000-0000-0000-0000-000000000000'::uuid AS center_location_id,
    100::integer AS result_limit,
    60::integer AS days_ahead
)
SELECT s.*
FROM params p
CROSS JOIN LATERAL public.get_nearby_musician_slots_for_center_with_expansion(
  p.center_location_id,
  p.result_limit,
  p.days_ahead,
  0
) AS s;

-- 2) Expanded query (+10 mi)
-- Expectation: result count is >= baseline and may include farther musician slots.
WITH params AS (
  SELECT
    '00000000-0000-0000-0000-000000000000'::uuid AS center_location_id,
    100::integer AS result_limit,
    60::integer AS days_ahead
)
SELECT s.*
FROM params p
CROSS JOIN LATERAL public.get_nearby_musician_slots_for_center_with_expansion(
  p.center_location_id,
  p.result_limit,
  p.days_ahead,
  10
) AS s;

-- 3) Optional targeted checks (replace UUID placeholders first)
-- WITH cfg AS (
--   SELECT
--     '00000000-0000-0000-0000-000000000000'::uuid AS center_location_id,
--     '11111111-1111-1111-1111-111111111111'::uuid AS near_musician_id,
--     '22222222-2222-2222-2222-222222222222'::uuid AS farther_musician_id
-- ),
-- base AS (
--   SELECT DISTINCT s.musician_id
--   FROM cfg c
--   CROSS JOIN LATERAL public.get_nearby_musician_slots_for_center_with_expansion(c.center_location_id, 100, 60, 0) AS s
-- ),
-- expanded AS (
--   SELECT DISTINCT s.musician_id
--   FROM cfg c
--   CROSS JOIN LATERAL public.get_nearby_musician_slots_for_center_with_expansion(c.center_location_id, 100, 60, 10) AS s
-- )
-- SELECT
--   EXISTS (SELECT 1 FROM base b, cfg c WHERE b.musician_id = c.near_musician_id) AS near_in_base,
--   EXISTS (SELECT 1 FROM expanded e, cfg c WHERE e.musician_id = c.farther_musician_id) AS farther_in_expanded;

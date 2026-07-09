-- Sprint 4: Replace alert_type enum with clean 6-value system
-- Removes legacy unused types (new_opportunity, request_status_change, new_match, profile_update)
-- Keeps only: request_initiated, request_accepted, request_cancelled, proposal_suggested, event_completed, event_cancelled

-- Create new clean enum with only the 6 Sprint 4 alert types
CREATE TYPE alert_type_v2 AS ENUM (
  'request_initiated',
  'request_accepted',
  'request_cancelled',
  'proposal_suggested',
  'event_completed',
  'event_cancelled'
);

-- Migrate data from old enum to new (cast text to new enum)
ALTER TABLE alerts
  ALTER COLUMN alert_type TYPE alert_type_v2
  USING alert_type::text::alert_type_v2;

-- Migrate notifications_log data
ALTER TABLE notifications_log
  ALTER COLUMN alert_type TYPE alert_type_v2
  USING alert_type::text::alert_type_v2;

-- Drop the old enum type
DROP TYPE alert_type;

-- Rename the new enum back to the original name
ALTER TYPE alert_type_v2 RENAME TO alert_type;

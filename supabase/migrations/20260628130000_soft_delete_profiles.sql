-- Soft-delete support for musician and center profiles.
-- deleted_at is set when a user requests account deletion.
-- approved is also set to false on deletion, which is sufficient to exclude
-- soft-deleted profiles from all existing RLS discovery policies.
-- deleted_at is used purely for admin visibility and audit purposes.

ALTER TABLE musicians
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

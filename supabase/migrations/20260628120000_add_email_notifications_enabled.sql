-- Add email notification preference to users table.
-- Sprint 7's send path reads this flag before delivering email.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT true;

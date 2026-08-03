-- New alert type for the musician/facility approval notification.
-- ALTER TYPE ... ADD VALUE cannot be used in the same transaction as a
-- statement that reads the new value, but this migration only adds it —
-- the value is read later, from application code in a separate session.
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'account_approved';

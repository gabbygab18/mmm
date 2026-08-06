-- New alert types: a security confirmation email when the account password is
-- changed, and a confirmation email when account deletion completes.
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'password_changed';
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'account_deleted';

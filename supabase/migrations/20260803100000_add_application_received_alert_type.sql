-- New alert type for the "we received your application" email, sent right
-- after signup, before admin approval. Same caveat as account_approved:
-- ADD VALUE only, never read in the same transaction.
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'application_received';

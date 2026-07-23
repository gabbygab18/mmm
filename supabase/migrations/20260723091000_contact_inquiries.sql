-- ============================================================================
-- Contact form inbox
--
-- Backs the public /contact page. Inquiries are stored so nothing is lost while
-- the outbound mail transport is provisioned; admins read them from the
-- dashboard. Anonymous visitors may insert but never read.
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type VARCHAR(20) NOT NULL CHECK (inquiry_type IN ('volunteer', 'facility')),
  full_name    VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  phone        VARCHAR(40),
  message      TEXT NOT NULL,
  handled      BOOLEAN NOT NULL DEFAULT FALSE,
  handled_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  handled_at   TIMESTAMP WITH TIME ZONE,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS contact_inquiries_created_idx ON contact_inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_inquiries_open_idx ON contact_inquiries (handled, created_at DESC);

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone may submit the public form.
DROP POLICY IF EXISTS "contact_inquiries_public_insert" ON contact_inquiries;
CREATE POLICY "contact_inquiries_public_insert" ON contact_inquiries
  FOR INSERT WITH CHECK (TRUE);

-- Only admins may read or triage them.
DROP POLICY IF EXISTS "contact_inquiries_admin_select" ON contact_inquiries;
CREATE POLICY "contact_inquiries_admin_select" ON contact_inquiries
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "contact_inquiries_admin_update" ON contact_inquiries;
CREATE POLICY "contact_inquiries_admin_update" ON contact_inquiries
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

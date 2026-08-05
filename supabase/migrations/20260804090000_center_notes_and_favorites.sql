-- Facility dashboard additions: private notes a center keeps for itself, and
-- a shortlist of musicians they want to book again.

CREATE TABLE center_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_center_notes_center_created ON center_notes (center_id, created_at DESC);

ALTER TABLE center_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "center_notes_owner_all"
  ON center_notes FOR ALL
  USING (center_id IN (SELECT id FROM centers WHERE user_id = auth.uid()))
  WITH CHECK (center_id IN (SELECT id FROM centers WHERE user_id = auth.uid()));

CREATE POLICY "center_notes_admin_view_all"
  ON center_notes FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE TABLE center_favorite_musicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  musician_id UUID NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (center_id, musician_id)
);

CREATE INDEX idx_center_favorite_musicians_center ON center_favorite_musicians (center_id);

ALTER TABLE center_favorite_musicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "center_favorite_musicians_owner_all"
  ON center_favorite_musicians FOR ALL
  USING (center_id IN (SELECT id FROM centers WHERE user_id = auth.uid()))
  WITH CHECK (center_id IN (SELECT id FROM centers WHERE user_id = auth.uid()));

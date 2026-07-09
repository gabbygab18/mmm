-- Sprint 6: Admin moderation flags + event media portfolio foundation

CREATE TABLE IF NOT EXISTS public.moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_id UUID REFERENCES public.musicians(id) ON DELETE CASCADE,
  center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  created_by_admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  resolved_by_admin_user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT moderation_flags_target_check CHECK (
    (musician_id IS NOT NULL AND center_id IS NULL)
    OR (musician_id IS NULL AND center_id IS NOT NULL)
  ),
  CONSTRAINT moderation_flags_status_check CHECK (status IN ('open', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_moderation_flags_musician_id
  ON public.moderation_flags(musician_id);

CREATE INDEX IF NOT EXISTS idx_moderation_flags_center_id
  ON public.moderation_flags(center_id);

CREATE INDEX IF NOT EXISTS idx_moderation_flags_status_created
  ON public.moderation_flags(status, created_at DESC);

ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moderation_flags_admin_view_all ON public.moderation_flags;
CREATE POLICY moderation_flags_admin_view_all
  ON public.moderation_flags
  FOR SELECT
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS moderation_flags_admin_insert ON public.moderation_flags;
CREATE POLICY moderation_flags_admin_insert
  ON public.moderation_flags
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    AND created_by_admin_user_id = auth.uid()
  );

DROP POLICY IF EXISTS moderation_flags_admin_update ON public.moderation_flags;
CREATE POLICY moderation_flags_admin_update
  ON public.moderation_flags
  FOR UPDATE
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS moderation_flags_admin_delete ON public.moderation_flags;
CREATE POLICY moderation_flags_admin_delete
  ON public.moderation_flags
  FOR DELETE
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.moderation_flags TO authenticated;

CREATE TABLE IF NOT EXISTS public.event_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  label_override TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  updated_by_admin_user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT event_media_unique_request_url UNIQUE(request_id, youtube_url),
  CONSTRAINT event_media_youtube_url_check CHECK (
    youtube_url ~* '^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/).+'
  )
);

CREATE INDEX IF NOT EXISTS idx_event_media_request_id
  ON public.event_media(request_id);

CREATE INDEX IF NOT EXISTS idx_event_media_published_created
  ON public.event_media(published, created_at DESC);

CREATE OR REPLACE FUNCTION public.ensure_event_media_request_completed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  request_status_value public.request_status;
BEGIN
  SELECT r.status INTO request_status_value
  FROM public.requests r
  WHERE r.id = NEW.request_id;

  IF request_status_value IS NULL THEN
    RAISE EXCEPTION 'Invalid request_id for event_media row.';
  END IF;

  IF request_status_value <> 'completed' THEN
    RAISE EXCEPTION 'Event media can only be attached to completed requests.';
  END IF;

  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_media_ensure_completed_request ON public.event_media;
CREATE TRIGGER trg_event_media_ensure_completed_request
  BEFORE INSERT OR UPDATE ON public.event_media
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_event_media_request_completed();

ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_media_admin_view_all ON public.event_media;
CREATE POLICY event_media_admin_view_all
  ON public.event_media
  FOR SELECT
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS event_media_published_view ON public.event_media;
CREATE POLICY event_media_published_view
  ON public.event_media
  FOR SELECT
  USING (
    published = TRUE
    AND EXISTS (
      SELECT 1
      FROM public.requests r
      JOIN public.musicians m ON m.id = r.musician_id
      JOIN public.center_locations cl ON cl.id = r.center_location_id
      JOIN public.centers c ON c.id = cl.center_id
      WHERE r.id = event_media.request_id
        AND r.status = 'completed'
        AND m.approved = TRUE
        AND c.approved = TRUE
    )
  );

DROP POLICY IF EXISTS event_media_admin_insert ON public.event_media;
CREATE POLICY event_media_admin_insert
  ON public.event_media
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    AND created_by_admin_user_id = auth.uid()
  );

DROP POLICY IF EXISTS event_media_admin_update ON public.event_media;
CREATE POLICY event_media_admin_update
  ON public.event_media
  FOR UPDATE
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS event_media_admin_delete ON public.event_media;
CREATE POLICY event_media_admin_delete
  ON public.event_media
  FOR DELETE
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_media TO authenticated;

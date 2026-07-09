-- Sprint 3: Alternate time proposals for request negotiation

CREATE TABLE IF NOT EXISTS public.request_time_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  proposed_date DATE NOT NULL,
  proposed_start_time TIME NOT NULL,
  proposed_end_time TIME NOT NULL,
  notes TEXT,
  proposed_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  proposal_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT request_time_proposals_status_valid CHECK (proposal_status IN ('pending', 'accepted', 'superseded', 'withdrawn')),
  CONSTRAINT request_time_proposals_time_window_valid CHECK (proposed_end_time > proposed_start_time)
);

CREATE INDEX IF NOT EXISTS idx_request_time_proposals_request_id
  ON public.request_time_proposals(request_id);

CREATE INDEX IF NOT EXISTS idx_request_time_proposals_request_created
  ON public.request_time_proposals(request_id, created_at DESC);

ALTER TABLE public.request_time_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS request_time_proposals_view_involved ON public.request_time_proposals;
CREATE POLICY request_time_proposals_view_involved
  ON public.request_time_proposals
  FOR SELECT
  USING (
    request_id IN (
      SELECT r.id
      FROM public.requests r
      WHERE r.musician_id IN (SELECT m.id FROM public.musicians m WHERE m.user_id = auth.uid())
         OR r.center_location_id IN (
           SELECT cl.id
           FROM public.center_locations cl
           JOIN public.centers c ON c.id = cl.center_id
           WHERE c.user_id = auth.uid()
         )
    )
  );

DROP POLICY IF EXISTS request_time_proposals_insert_involved ON public.request_time_proposals;
CREATE POLICY request_time_proposals_insert_involved
  ON public.request_time_proposals
  FOR INSERT
  WITH CHECK (
    proposed_by_user_id = auth.uid()
    AND request_id IN (
      SELECT r.id
      FROM public.requests r
      WHERE r.musician_id IN (SELECT m.id FROM public.musicians m WHERE m.user_id = auth.uid())
         OR r.center_location_id IN (
           SELECT cl.id
           FROM public.center_locations cl
           JOIN public.centers c ON c.id = cl.center_id
           WHERE c.user_id = auth.uid()
         )
    )
  );

DROP POLICY IF EXISTS request_time_proposals_update_involved ON public.request_time_proposals;
CREATE POLICY request_time_proposals_update_involved
  ON public.request_time_proposals
  FOR UPDATE
  USING (
    request_id IN (
      SELECT r.id
      FROM public.requests r
      WHERE r.musician_id IN (SELECT m.id FROM public.musicians m WHERE m.user_id = auth.uid())
         OR r.center_location_id IN (
           SELECT cl.id
           FROM public.center_locations cl
           JOIN public.centers c ON c.id = cl.center_id
           WHERE c.user_id = auth.uid()
         )
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.request_time_proposals TO authenticated;

INSERT INTO public.request_time_proposals (
  request_id,
  proposed_date,
  proposed_start_time,
  proposed_end_time,
  notes,
  proposed_by_user_id,
  proposal_status
)
SELECT
  r.id,
  r.requested_date,
  COALESCE(r.requested_start_time, '10:00'::time),
  COALESCE(r.requested_end_time, '11:00'::time),
  r.notes,
  CASE
    WHEN r.initiator_role = 'musician' THEN (
      SELECT m.user_id
      FROM public.musicians m
      WHERE m.id = r.musician_id
      LIMIT 1
    )
    ELSE (
      SELECT c.user_id
      FROM public.center_locations cl
      JOIN public.centers c ON c.id = cl.center_id
      WHERE cl.id = r.center_location_id
      LIMIT 1
    )
  END,
  CASE
    WHEN r.status IN ('accepted', 'completed') THEN 'accepted'
    WHEN r.status = 'cancelled' THEN 'superseded'
    ELSE 'pending'
  END
FROM public.requests r
WHERE NOT EXISTS (
  SELECT 1
  FROM public.request_time_proposals p
  WHERE p.request_id = r.id
);

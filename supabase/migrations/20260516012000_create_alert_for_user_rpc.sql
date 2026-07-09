-- Fix: allow server actions to create alerts for other users under RLS
-- Accept/cancel transitions notify the opposite party, which cannot be inserted
-- directly by the acting user under alerts_insert_own policy.

CREATE OR REPLACE FUNCTION public.create_alert_for_user(
  p_user_id UUID,
  p_alert_type alert_type,
  p_title TEXT,
  p_message TEXT,
  p_related_request_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO alerts (user_id, alert_type, title, message, related_request_id)
  VALUES (p_user_id, p_alert_type, p_title, p_message, p_related_request_id)
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_alert_for_user(UUID, alert_type, TEXT, TEXT, UUID) TO authenticated;

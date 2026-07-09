-- Remove admin global visibility over user notifications.
-- Keep notification access scoped to each recipient user only.

DROP POLICY IF EXISTS "alerts_admin_view_all" ON public.alerts;
DROP POLICY IF EXISTS "notifications_log_admin_view_all" ON public.notifications_log;

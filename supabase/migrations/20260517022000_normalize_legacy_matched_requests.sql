-- Normalize legacy matched status rows now that app no longer surfaces matched.
-- Keep enum compatibility for now; remap existing records to initiated.

UPDATE public.requests
SET status = 'initiated'
WHERE status = 'matched';

UPDATE public.request_status_history
SET old_status = 'initiated'
WHERE old_status = 'matched';

UPDATE public.request_status_history
SET new_status = 'initiated'
WHERE new_status = 'matched';

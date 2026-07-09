-- Sprint 3: Request and center-request-date time slots
-- Adds time windows so request flows match calendar-style availability UX.

ALTER TABLE public.center_request_dates
  ADD COLUMN IF NOT EXISTS start_time TIME NOT NULL DEFAULT '09:00'::time,
  ADD COLUMN IF NOT EXISTS end_time TIME NOT NULL DEFAULT '17:00'::time;

ALTER TABLE public.center_request_dates
  DROP CONSTRAINT IF EXISTS center_request_dates_center_location_id_requested_date_key;

ALTER TABLE public.center_request_dates
  DROP CONSTRAINT IF EXISTS center_request_dates_unique_slot;

ALTER TABLE public.center_request_dates
  ADD CONSTRAINT center_request_dates_unique_slot
  UNIQUE (center_location_id, requested_date, start_time, end_time);

ALTER TABLE public.center_request_dates
  DROP CONSTRAINT IF EXISTS center_request_dates_time_window_valid;

ALTER TABLE public.center_request_dates
  ADD CONSTRAINT center_request_dates_time_window_valid
  CHECK (end_time > start_time);

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS requested_start_time TIME,
  ADD COLUMN IF NOT EXISTS requested_end_time TIME;

ALTER TABLE public.requests
  DROP CONSTRAINT IF EXISTS requests_time_window_valid;

ALTER TABLE public.requests
  ADD CONSTRAINT requests_time_window_valid
  CHECK (
    requested_start_time IS NULL
    OR requested_end_time IS NULL
    OR requested_end_time > requested_start_time
  );

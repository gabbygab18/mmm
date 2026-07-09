-- Upgrade musician availability from date-only to date + time slot windows

ALTER TABLE public.musician_availability_dates
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME;

UPDATE public.musician_availability_dates
SET
  start_time = COALESCE(start_time, TIME '10:00'),
  end_time = COALESCE(end_time, TIME '11:00')
WHERE start_time IS NULL OR end_time IS NULL;

ALTER TABLE public.musician_availability_dates
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN end_time SET NOT NULL;

ALTER TABLE public.musician_availability_dates
  DROP CONSTRAINT IF EXISTS musician_availability_dates_musician_id_available_date_key;

ALTER TABLE public.musician_availability_dates
  DROP CONSTRAINT IF EXISTS musician_availability_dates_valid_time_window;

ALTER TABLE public.musician_availability_dates
  ADD CONSTRAINT musician_availability_dates_valid_time_window
  CHECK (start_time < end_time);

ALTER TABLE public.musician_availability_dates
  DROP CONSTRAINT IF EXISTS musician_availability_dates_unique_slot;

ALTER TABLE public.musician_availability_dates
  ADD CONSTRAINT musician_availability_dates_unique_slot
  UNIQUE (musician_id, available_date, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_musician_availability_date_start_time
  ON public.musician_availability_dates (available_date, start_time);

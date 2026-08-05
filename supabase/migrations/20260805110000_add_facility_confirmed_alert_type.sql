-- New alert type for the facility-confirmed notification — the point at
-- which a facility actually becomes discoverable to musicians, now that
-- "confirmed" is a separate gate from "approved".
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'facility_confirmed';

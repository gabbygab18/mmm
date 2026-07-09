-- Sprint 4: Database triggers for automatic alert creation

-- Function to create alerts for request_initiated
CREATE OR REPLACE FUNCTION notify_request_initiated()
RETURNS TRIGGER AS $$
DECLARE
  musician_user_id UUID;
  center_user_id UUID;
  musician_name TEXT;
  location_name TEXT;
  date_str TEXT;
  time_str TEXT;
BEGIN
  -- Get musician info
  SELECT m.user_id, m.name INTO musician_user_id, musician_name
  FROM musicians m
  WHERE m.id = NEW.musician_id;

  -- Get center location and center info
  SELECT cl.name, c.user_id INTO location_name, center_user_id
  FROM center_locations cl
  JOIN centers c ON c.id = cl.center_id
  WHERE cl.id = NEW.center_location_id;

  -- Format date and time
  date_str := to_char(NEW.requested_date::date, 'Mon DD, YYYY');
  
  IF NEW.requested_start_time IS NOT NULL AND NEW.requested_end_time IS NOT NULL THEN
    time_str := to_char(NEW.requested_start_time::time, 'HH12:MI AM') || ' - ' || to_char(NEW.requested_end_time::time, 'HH12:MI AM');
  ELSE
    time_str := 'TBD';
  END IF;

  -- Create alert for musician (if center initiated)
  IF NEW.initiator_role = 'center_coordinator' AND musician_user_id IS NOT NULL THEN
    INSERT INTO alerts (user_id, alert_type, title, message, related_request_id)
    VALUES (
      musician_user_id,
      'request_initiated'::alert_type,
      'New Request from ' || location_name,
      location_name || ' has requested you for ' || date_str || ' at ' || time_str || '.',
      NEW.id
    );
  END IF;

  -- Create alert for center (if musician initiated)
  IF NEW.initiator_role = 'musician' AND center_user_id IS NOT NULL THEN
    INSERT INTO alerts (user_id, alert_type, title, message, related_request_id)
    VALUES (
      center_user_id,
      'request_initiated'::alert_type,
      'New Request from ' || musician_name,
      musician_name || ' has requested to perform at ' || location_name || ' on ' || date_str || ' at ' || time_str || '.',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after inserting a request
CREATE TRIGGER request_initiated_trigger
AFTER INSERT ON requests
FOR EACH ROW
EXECUTE FUNCTION notify_request_initiated();

-- Function to create alerts for proposal_suggested
CREATE OR REPLACE FUNCTION notify_proposal_suggested()
RETURNS TRIGGER AS $$
DECLARE
  request_row RECORD;
  musician_user_id UUID;
  center_user_id UUID;
  musician_name TEXT;
  location_name TEXT;
  proposer_id UUID;
  proposer_is_musician BOOLEAN;
  date_str TEXT;
  time_str TEXT;
  proposal_count INT;
BEGIN
  -- Only create alert if this is a new pending proposal
  IF NEW.proposal_status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get request details
  SELECT id, musician_id, center_location_id, status
  INTO request_row
  FROM requests
  WHERE id = NEW.request_id;

  IF request_row IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count existing proposals for this request (excluding the one being inserted)
  SELECT COUNT(*) INTO proposal_count
  FROM request_time_proposals
  WHERE request_id = NEW.request_id
    AND id != NEW.id
    AND proposal_status != 'withdrawn';

  -- Skip alert if this is the initial proposal (no other proposals exist yet)
  -- because the request_initiated trigger already notified the other party
  IF proposal_count = 0 AND request_row.status = 'initiated' THEN
    RETURN NEW;
  END IF;

  -- Get musician info
  SELECT m.user_id, m.name INTO musician_user_id, musician_name
  FROM musicians m
  WHERE m.id = request_row.musician_id;

  -- Get center location and center info
  SELECT cl.name, c.user_id INTO location_name, center_user_id
  FROM center_locations cl
  JOIN centers c ON c.id = cl.center_id
  WHERE cl.id = request_row.center_location_id;

  -- Determine who is proposing
  proposer_id := NEW.proposed_by_user_id;
  proposer_is_musician := (proposer_id = musician_user_id);

  -- Format date and time
  date_str := to_char(NEW.proposed_date::date, 'Mon DD, YYYY');
  time_str := to_char(NEW.proposed_start_time::time, 'HH12:MI AM') || ' - ' || to_char(NEW.proposed_end_time::time, 'HH12:MI AM');

  -- Create alert for the OTHER party (non-proposer)
  IF proposer_is_musician AND center_user_id IS NOT NULL THEN
    -- Musician proposed, notify center
    INSERT INTO alerts (user_id, alert_type, title, message, related_request_id)
    VALUES (
      center_user_id,
      'proposal_suggested'::alert_type,
      'New Proposal from ' || musician_name,
      musician_name || ' has suggested ' || date_str || ' at ' || time_str || ' instead.',
      request_row.id
    );
  ELSIF NOT proposer_is_musician AND musician_user_id IS NOT NULL THEN
    -- Center proposed, notify musician
    INSERT INTO alerts (user_id, alert_type, title, message, related_request_id)
    VALUES (
      musician_user_id,
      'proposal_suggested'::alert_type,
      'New Proposal from ' || location_name,
      location_name || ' has suggested ' || date_str || ' at ' || time_str || ' instead.',
      request_row.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after inserting a proposal
CREATE TRIGGER proposal_suggested_trigger
AFTER INSERT ON request_time_proposals
FOR EACH ROW
EXECUTE FUNCTION notify_proposal_suggested();

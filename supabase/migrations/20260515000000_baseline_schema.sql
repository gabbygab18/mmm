-- Baseline schema for Music Memory Care MVP
-- Creates core entities: users, musicians, centers, requests, alerts, notifications

-- Enum for user roles
CREATE TYPE user_role AS ENUM ('musician', 'center_coordinator', 'admin');

-- Enum for request status
CREATE TYPE request_status AS ENUM ('initiated', 'matched', 'accepted', 'completed', 'cancelled');

-- Enum for alert types
CREATE TYPE alert_type AS ENUM ('new_opportunity', 'request_status_change', 'new_match', 'profile_update');

-- Core users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Musicians table
CREATE TABLE musicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  zip_code VARCHAR(5) NOT NULL,
  phone VARCHAR(20),
  music_types TEXT[] DEFAULT '{}', -- e.g., ['jazz', 'classical', 'folk']
  instruments TEXT[] DEFAULT '{}', -- e.g., ['guitar', 'piano']
  band_size_preference VARCHAR(50), -- e.g., 'solo', 'duo', 'trio'
  compensation_preference VARCHAR(100),
  willing_to_travel BOOLEAN DEFAULT TRUE,
  travel_radius_miles INT DEFAULT 15,
  has_own_transport BOOLEAN DEFAULT FALSE,
  profile_image_url VARCHAR(255),
  profile_complete BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Centers table
CREATE TABLE centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  resident_count INT,
  profile_image_url VARCHAR(255),
  profile_complete BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Center locations (multi-location support)
CREATE TABLE center_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  zip_code VARCHAR(5) NOT NULL,
  phone VARCHAR(20),
  supports_transport BOOLEAN DEFAULT FALSE,
  location_image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Musician availability dates
CREATE TABLE musician_availability_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_id UUID NOT NULL REFERENCES musicians(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(musician_id, available_date)
);

-- Center request dates
CREATE TABLE center_request_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_location_id UUID NOT NULL REFERENCES center_locations(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(center_location_id, requested_date)
);

-- Requests (core workflow entity)
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_id UUID REFERENCES musicians(id) ON DELETE CASCADE,
  center_location_id UUID REFERENCES center_locations(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  status request_status DEFAULT 'initiated',
  initiator_role user_role NOT NULL, -- 'musician' or 'center_coordinator'
  notes TEXT,
  matched_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_request CHECK (musician_id IS NOT NULL OR center_location_id IS NOT NULL)
);

-- Request status history (audit trail)
CREATE TABLE request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  old_status request_status,
  new_status request_status NOT NULL,
  changed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- In-app alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type alert_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email notifications log
CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_to VARCHAR(255) NOT NULL,
  alert_type alert_type NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  related_request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  bounce_status VARCHAR(50) -- 'sent', 'bounced', 'complained'
);

-- Create indexes for query performance
CREATE INDEX idx_musicians_user_id ON musicians(user_id);
CREATE INDEX idx_musicians_zip ON musicians(zip_code);
CREATE INDEX idx_centers_user_id ON centers(user_id);
CREATE INDEX idx_center_locations_center_id ON center_locations(center_id);
CREATE INDEX idx_center_locations_zip ON center_locations(zip_code);
CREATE INDEX idx_musician_availability_musician_id ON musician_availability_dates(musician_id);
CREATE INDEX idx_musician_availability_date ON musician_availability_dates(available_date);
CREATE INDEX idx_center_request_dates_location_id ON center_request_dates(center_location_id);
CREATE INDEX idx_center_request_dates_date ON center_request_dates(requested_date);
CREATE INDEX idx_requests_musician_id ON requests(musician_id);
CREATE INDEX idx_requests_center_location_id ON requests(center_location_id);
CREATE INDEX idx_requests_date ON requests(requested_date);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_request_history_request_id ON request_status_history(request_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_read ON alerts(read);
CREATE INDEX idx_notifications_user_id ON notifications_log(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE musician_availability_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_request_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

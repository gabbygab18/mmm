-- Row-Level Security (RLS) Policies for Music Memory Care
-- Enforces role-based access control: musicians, center_coordinators, admins

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own record
CREATE POLICY "users_view_own" ON users FOR SELECT USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "users_admin_view_all" ON users FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Admins can update all users
CREATE POLICY "users_admin_update_all" ON users FOR UPDATE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- MUSICIANS TABLE POLICIES
-- ============================================================================

-- Everyone can view approved musician profiles (public discovery)
CREATE POLICY "musicians_view_approved" ON musicians FOR SELECT USING (approved = TRUE);

-- Musicians can view their own profile
CREATE POLICY "musicians_view_own" ON musicians FOR SELECT USING (
  user_id = auth.uid()
);

-- Musicians can insert their own profile
CREATE POLICY "musicians_insert_own" ON musicians FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Musicians can update their own profile
CREATE POLICY "musicians_update_own" ON musicians FOR UPDATE USING (
  user_id = auth.uid()
);

-- Admins can view all musician profiles (for moderation)
CREATE POLICY "musicians_admin_view_all" ON musicians FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Admins can update any musician profile
CREATE POLICY "musicians_admin_update_all" ON musicians FOR UPDATE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- CENTERS TABLE POLICIES
-- ============================================================================

-- Everyone can view approved center profiles (public discovery)
CREATE POLICY "centers_view_approved" ON centers FOR SELECT USING (approved = TRUE);

-- Center coordinators can view their own profile
CREATE POLICY "centers_view_own" ON centers FOR SELECT USING (
  user_id = auth.uid()
);

-- Center coordinators can insert their own profile
CREATE POLICY "centers_insert_own" ON centers FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Center coordinators can update their own profile
CREATE POLICY "centers_update_own" ON centers FOR UPDATE USING (
  user_id = auth.uid()
);

-- Admins can view all center profiles
CREATE POLICY "centers_admin_view_all" ON centers FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Admins can update any center profile
CREATE POLICY "centers_admin_update_all" ON centers FOR UPDATE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- CENTER_LOCATIONS TABLE POLICIES
-- ============================================================================

-- Everyone can view locations of approved centers
CREATE POLICY "center_locations_view_approved" ON center_locations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM centers WHERE centers.id = center_locations.center_id AND centers.approved = TRUE
  )
);

-- Center coordinators can view their own center's locations
CREATE POLICY "center_locations_view_own_center" ON center_locations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM centers 
    WHERE centers.id = center_locations.center_id AND centers.user_id = auth.uid()
  )
);

-- Center coordinators can insert locations for their center
CREATE POLICY "center_locations_insert_own" ON center_locations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM centers 
    WHERE centers.id = center_locations.center_id AND centers.user_id = auth.uid()
  )
);

-- Center coordinators can update their own locations
CREATE POLICY "center_locations_update_own" ON center_locations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM centers 
    WHERE centers.id = center_locations.center_id AND centers.user_id = auth.uid()
  )
);

-- Admins can view all locations
CREATE POLICY "center_locations_admin_view_all" ON center_locations FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Admins can update all locations
CREATE POLICY "center_locations_admin_update_all" ON center_locations FOR UPDATE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- MUSICIAN_AVAILABILITY_DATES TABLE POLICIES
-- ============================================================================

-- Everyone can view availability dates for approved musicians
CREATE POLICY "musician_availability_view_approved" ON musician_availability_dates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM musicians 
    WHERE musicians.id = musician_availability_dates.musician_id AND musicians.approved = TRUE
  )
);

-- Musicians can view their own availability
CREATE POLICY "musician_availability_view_own" ON musician_availability_dates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM musicians 
    WHERE musicians.id = musician_availability_dates.musician_id AND musicians.user_id = auth.uid()
  )
);

-- Musicians can insert their own availability
CREATE POLICY "musician_availability_insert_own" ON musician_availability_dates FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM musicians 
    WHERE musicians.id = musician_availability_dates.musician_id AND musicians.user_id = auth.uid()
  )
);

-- Musicians can delete their own availability
CREATE POLICY "musician_availability_delete_own" ON musician_availability_dates FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM musicians 
    WHERE musicians.id = musician_availability_dates.musician_id AND musicians.user_id = auth.uid()
  )
);

-- Admins can view all availability
CREATE POLICY "musician_availability_admin_view_all" ON musician_availability_dates FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- CENTER_REQUEST_DATES TABLE POLICIES
-- ============================================================================

-- Everyone can view request dates for approved centers
CREATE POLICY "center_request_dates_view_approved" ON center_request_dates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM center_locations 
    JOIN centers ON centers.id = center_locations.center_id
    WHERE center_locations.id = center_request_dates.center_location_id AND centers.approved = TRUE
  )
);

-- Center coordinators can view their own center's request dates
CREATE POLICY "center_request_dates_view_own" ON center_request_dates FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM center_locations 
    JOIN centers ON centers.id = center_locations.center_id
    WHERE center_locations.id = center_request_dates.center_location_id AND centers.user_id = auth.uid()
  )
);

-- Center coordinators can insert request dates for their locations
CREATE POLICY "center_request_dates_insert_own" ON center_request_dates FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM center_locations 
    JOIN centers ON centers.id = center_locations.center_id
    WHERE center_locations.id = center_request_dates.center_location_id AND centers.user_id = auth.uid()
  )
);

-- Center coordinators can delete their own request dates
CREATE POLICY "center_request_dates_delete_own" ON center_request_dates FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM center_locations 
    JOIN centers ON centers.id = center_locations.center_id
    WHERE center_locations.id = center_request_dates.center_location_id AND centers.user_id = auth.uid()
  )
);

-- Admins can view all request dates
CREATE POLICY "center_request_dates_admin_view_all" ON center_request_dates FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- REQUESTS TABLE POLICIES
-- ============================================================================

-- Musicians can view requests involving them
CREATE POLICY "requests_musician_view" ON requests FOR SELECT USING (
  musician_id IN (SELECT id FROM musicians WHERE user_id = auth.uid())
  OR
  center_location_id IN (
    SELECT cl.id FROM center_locations cl
    JOIN centers c ON c.id = cl.center_id
    WHERE c.user_id = auth.uid()
  )
);

-- Musicians can insert requests
CREATE POLICY "requests_musician_insert" ON requests FOR INSERT WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'musician'
);

-- Musicians can update requests they initiated
CREATE POLICY "requests_musician_update" ON requests FOR UPDATE USING (
  musician_id IN (SELECT id FROM musicians WHERE user_id = auth.uid())
);

-- Center coordinators can insert requests
CREATE POLICY "requests_center_insert" ON requests FOR INSERT WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'center_coordinator'
);

-- Center coordinators can update requests from their centers
CREATE POLICY "requests_center_update" ON requests FOR UPDATE USING (
  center_location_id IN (
    SELECT cl.id FROM center_locations cl
    JOIN centers c ON c.id = cl.center_id
    WHERE c.user_id = auth.uid()
  )
);

-- Admins can view all requests
CREATE POLICY "requests_admin_view_all" ON requests FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Admins can update all requests
CREATE POLICY "requests_admin_update_all" ON requests FOR UPDATE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- REQUEST_STATUS_HISTORY TABLE POLICIES
-- ============================================================================

-- Users can view history for requests they're involved in
CREATE POLICY "request_status_history_view" ON request_status_history FOR SELECT USING (
  request_id IN (
    SELECT id FROM requests 
    WHERE musician_id IN (SELECT id FROM musicians WHERE user_id = auth.uid())
    OR center_location_id IN (
      SELECT cl.id FROM center_locations cl
      JOIN centers c ON c.id = cl.center_id
      WHERE c.user_id = auth.uid()
    )
  )
);

-- Only backend (service role) can insert history; RLS allows all for now (enforced via API logic)
CREATE POLICY "request_status_history_insert_service" ON request_status_history FOR INSERT WITH CHECK (
  TRUE
);

-- Admins can view all history
CREATE POLICY "request_status_history_admin_view_all" ON request_status_history FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- ALERTS TABLE POLICIES
-- ============================================================================

-- Users can view only their own alerts
CREATE POLICY "alerts_view_own" ON alerts FOR SELECT USING (
  user_id = auth.uid()
);

-- Users can insert only their own alerts (backend constraint)
CREATE POLICY "alerts_insert_own" ON alerts FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Users can update only their own alerts (read/dismiss flags)
CREATE POLICY "alerts_update_own" ON alerts FOR UPDATE USING (
  user_id = auth.uid()
);

-- Users can delete only their own alerts
CREATE POLICY "alerts_delete_own" ON alerts FOR DELETE USING (
  user_id = auth.uid()
);

-- Admins can view all alerts
CREATE POLICY "alerts_admin_view_all" ON alerts FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- ============================================================================
-- NOTIFICATIONS_LOG TABLE POLICIES
-- ============================================================================

-- Users can view only their own notification log
CREATE POLICY "notifications_log_view_own" ON notifications_log FOR SELECT USING (
  user_id = auth.uid()
);

-- Backend service role can insert (enforced via API, allow all at RLS level)
CREATE POLICY "notifications_log_insert_service" ON notifications_log FOR INSERT WITH CHECK (
  TRUE
);

-- Admins can view all notifications
CREATE POLICY "notifications_log_admin_view_all" ON notifications_log FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

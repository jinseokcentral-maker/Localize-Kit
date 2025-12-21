-- ============================================
-- LocalizeKit - Webhooks & API Usage RLS Policies
-- ============================================
-- Run AFTER 20241203000003_webhooks_and_api_usage.sql

-- ============================================
-- WEBHOOKS POLICIES
-- ============================================

-- Only project owner can view webhooks
CREATE POLICY "webhooks_select"
  ON webhooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = webhooks.project_id 
        AND owner_id = auth.uid()
    )
  );

-- Only project owner can create webhooks (Pro+ only, checked in application)
CREATE POLICY "webhooks_insert"
  ON webhooks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = webhooks.project_id 
        AND owner_id = auth.uid()
    )
  );

-- Only project owner can update webhooks
CREATE POLICY "webhooks_update"
  ON webhooks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = webhooks.project_id 
        AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = webhooks.project_id 
        AND owner_id = auth.uid()
    )
  );

-- Only project owner can delete webhooks
CREATE POLICY "webhooks_delete"
  ON webhooks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = webhooks.project_id 
        AND owner_id = auth.uid()
    )
  );

-- ============================================
-- WEBHOOK_EVENTS POLICIES
-- ============================================

-- Only project owner can view webhook events
CREATE POLICY "webhook_events_select"
  ON webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      JOIN projects p ON p.id = w.project_id
      WHERE w.id = webhook_events.webhook_id
        AND p.owner_id = auth.uid()
    )
  );

-- Only system (service_role) can insert webhook events (via triggers/Edge Functions)
-- No direct user insert policy

-- Only system can update webhook events (for retry logic)
-- No direct user update policy

-- ============================================
-- WEBHOOK_DELIVERIES POLICIES
-- ============================================

-- Only project owner can view webhook delivery history
CREATE POLICY "webhook_deliveries_select"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhook_events we
      JOIN webhooks w ON w.id = we.webhook_id
      JOIN projects p ON p.id = w.project_id
      WHERE we.id = webhook_deliveries.webhook_event_id
        AND p.owner_id = auth.uid()
    )
  );

-- Only system can insert webhook deliveries
-- No direct user insert policy

-- ============================================
-- API_USAGE POLICIES
-- ============================================

-- Only project owner can view API usage
CREATE POLICY "api_usage_select"
  ON api_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = api_usage.project_id 
        AND owner_id = auth.uid()
    )
  );

-- Only system (service_role) can insert/update API usage (via Edge Functions)
-- No direct user insert/update policy















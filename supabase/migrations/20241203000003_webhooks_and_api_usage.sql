-- ============================================
-- LocalizeKit - Webhooks & API Usage Tracking
-- ============================================
-- Run AFTER 00001_initial_schema.sql and 00002_rls_policies.sql
-- Adds webhook management and API usage tracking

-- ============================================
-- 8. WEBHOOKS
-- ============================================
-- Stores webhook endpoints for projects (Pro+ feature)
-- Allows customers to receive real-time notifications when translations change

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT, -- For HMAC signature verification
  events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- ['string.created', 'string.updated', 'string.deleted', 'translation.updated', 'locale.updated']
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_webhooks_project_id ON webhooks(project_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE webhooks IS 'Webhook endpoints for translation change events (Pro+)';
COMMENT ON COLUMN webhooks.events IS 'Array of event types to subscribe to';
COMMENT ON COLUMN webhooks.secret IS 'HMAC secret for signature verification';

-- ============================================
-- 9. WEBHOOK_EVENTS
-- ============================================
-- Queue of webhook events to be delivered
-- Handles retry logic and delivery status

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'string.created', 'string.updated', etc.
  payload JSONB NOT NULL, -- Event data
  attempt_count INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'failed')),
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_webhook_events_next_retry ON webhook_events(next_retry_at) WHERE status = 'failed' AND next_retry_at IS NOT NULL;

COMMENT ON TABLE webhook_events IS 'Queue of webhook events to be delivered';
COMMENT ON COLUMN webhook_events.event_type IS 'Event type: string.created, string.updated, string.deleted, translation.updated, locale.updated';
COMMENT ON COLUMN webhook_events.payload IS 'JSON payload to send to webhook URL';

-- ============================================
-- 10. WEBHOOK_DELIVERIES
-- ============================================
-- History of webhook delivery attempts
-- Used for debugging and monitoring

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL,
  status_code INT, -- HTTP status code from webhook endpoint
  response_body TEXT, -- Response body (truncated if too long)
  error_message TEXT, -- Error message if delivery failed
  duration_ms INT, -- Request duration in milliseconds
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook_event_id ON webhook_deliveries(webhook_event_id);
CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_delivered_at ON webhook_deliveries(delivered_at DESC);

COMMENT ON TABLE webhook_deliveries IS 'History of webhook delivery attempts';
COMMENT ON COLUMN webhook_deliveries.status_code IS 'HTTP status code from webhook endpoint (200 = success)';

-- ============================================
-- 11. API_USAGE
-- ============================================
-- Tracks API request usage for rate limiting
-- Pro: 50k/mo, Team: 200k/mo

CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  request_count INT DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(api_key_id, year, month)
);

CREATE INDEX idx_api_usage_api_key_id ON api_usage(api_key_id);
CREATE INDEX idx_api_usage_project_id ON api_usage(project_id);
CREATE INDEX idx_api_usage_year_month ON api_usage(year, month);

COMMENT ON TABLE api_usage IS 'Monthly API request usage tracking for rate limiting';
COMMENT ON COLUMN api_usage.year IS 'Year (e.g., 2024)';
COMMENT ON COLUMN api_usage.month IS 'Month (1-12)';

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_api_usage_updated_at
  BEFORE UPDATE ON api_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;


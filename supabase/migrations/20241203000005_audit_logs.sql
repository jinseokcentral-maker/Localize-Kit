-- ============================================
-- LocalizeKit - Audit Logs (Team Plan)
-- ============================================
-- Run AFTER 20241203000003_webhooks_and_api_usage.sql
-- Tracks user activities for Team plan audit logs

-- ============================================
-- 12. AUDIT_LOGS
-- ============================================
-- Tracks all user activities for Team plan
-- Used for compliance and activity monitoring

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'project.created', 'project.updated', 'project.deleted', 'member.invited', 'member.removed', 'translation.created', etc.
  resource_type TEXT NOT NULL, -- 'project', 'translation', 'team_member', 'webhook', 'api_key', etc.
  resource_id UUID, -- ID of the affected resource
  metadata JSONB DEFAULT '{}', -- Additional context (old values, new values, etc.)
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_project_id ON audit_logs(project_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Audit logs for Team plan - tracks all user activities';
COMMENT ON COLUMN audit_logs.action IS 'Action type: project.created, project.updated, member.invited, translation.created, etc.';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource: project, translation, team_member, webhook, api_key';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context: old/new values, changes, etc.';

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;












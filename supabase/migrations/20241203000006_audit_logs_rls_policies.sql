-- ============================================
-- LocalizeKit - Audit Logs RLS Policies
-- ============================================
-- Run AFTER 20241203000005_audit_logs.sql

-- ============================================
-- AUDIT_LOGS POLICIES
-- ============================================

-- Team members can view audit logs for their projects
CREATE POLICY "audit_logs_select"
  ON audit_logs FOR SELECT
  USING (
    -- User can view logs for projects they have access to
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = audit_logs.project_id
        AND (
          p.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.project_id = p.id
              AND tm.user_id = auth.uid()
              AND tm.joined_at IS NOT NULL
          )
        )
    )
  );

-- Only system (service_role) can insert audit logs
-- No direct user insert policy - managed by Edge Functions/backend

-- Users cannot update or delete audit logs (immutable)
-- No update/delete policies










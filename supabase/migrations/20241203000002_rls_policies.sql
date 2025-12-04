-- ============================================
-- LocalizeKit - RLS Policies
-- ============================================
-- Run AFTER 00001_initial_schema.sql

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Check project access
-- ============================================

CREATE OR REPLACE FUNCTION has_project_access(project_uuid UUID, required_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if user is owner
  IF EXISTS (SELECT 1 FROM projects WHERE id = project_uuid AND owner_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Check team membership
  SELECT role INTO user_role
  FROM team_members
  WHERE project_id = project_uuid 
    AND user_id = auth.uid()
    AND joined_at IS NOT NULL;  -- Must have accepted invitation
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check role hierarchy: owner > editor > viewer
  CASE required_role
    WHEN 'viewer' THEN RETURN TRUE;
    WHEN 'editor' THEN RETURN user_role IN ('owner', 'editor');
    WHEN 'owner' THEN RETURN user_role = 'owner';
    ELSE RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- PROJECTS POLICIES
-- ============================================

-- Users can view projects they own or are members of
CREATE POLICY "projects_select"
  ON projects FOR SELECT
  USING (
    owner_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE project_id = projects.id 
        AND user_id = auth.uid()
        AND joined_at IS NOT NULL
    )
  );

-- Users can create projects
CREATE POLICY "projects_insert"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Only owner can update project
CREATE POLICY "projects_update"
  ON projects FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Only owner can delete project
CREATE POLICY "projects_delete"
  ON projects FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- TEAM_MEMBERS POLICIES
-- ============================================

-- Users can view team members of their projects
CREATE POLICY "team_members_select"
  ON team_members FOR SELECT
  USING (has_project_access(project_id, 'viewer'));

-- Owner can invite team members
CREATE POLICY "team_members_insert"
  ON team_members FOR INSERT
  WITH CHECK (
    has_project_access(project_id, 'owner')
    AND role != 'owner'  -- Cannot add another owner
  );

-- Owner can update team member roles
CREATE POLICY "team_members_update"
  ON team_members FOR UPDATE
  USING (has_project_access(project_id, 'owner'))
  WITH CHECK (role != 'owner');  -- Cannot promote to owner

-- Owner can remove team members
CREATE POLICY "team_members_delete"
  ON team_members FOR DELETE
  USING (
    has_project_access(project_id, 'owner')
    AND role != 'owner'  -- Cannot remove owner
  );

-- Users can accept their own invitations
CREATE POLICY "team_members_accept_invite"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid() AND joined_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- TRANSLATIONS POLICIES
-- ============================================

-- Users can view translations of accessible projects
CREATE POLICY "translations_select"
  ON translations FOR SELECT
  USING (has_project_access(project_id, 'viewer'));

-- Editor+ can create translations
CREATE POLICY "translations_insert"
  ON translations FOR INSERT
  WITH CHECK (has_project_access(project_id, 'editor'));

-- Editor+ can update translations
CREATE POLICY "translations_update"
  ON translations FOR UPDATE
  USING (has_project_access(project_id, 'editor'))
  WITH CHECK (has_project_access(project_id, 'editor'));

-- Editor+ can delete translations
CREATE POLICY "translations_delete"
  ON translations FOR DELETE
  USING (has_project_access(project_id, 'editor'));

-- ============================================
-- TRANSLATION_HISTORY POLICIES
-- ============================================

-- Users can view history of accessible projects
CREATE POLICY "translation_history_select"
  ON translation_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM translations t
      WHERE t.id = translation_history.translation_id
        AND has_project_access(t.project_id, 'viewer')
    )
  );

-- No direct insert/update/delete - managed by triggers

-- ============================================
-- API_KEYS POLICIES
-- ============================================

-- Only owner can view API keys
CREATE POLICY "api_keys_select"
  ON api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = api_keys.project_id 
        AND owner_id = auth.uid()
    )
  );

-- Only owner can create API key
CREATE POLICY "api_keys_insert"
  ON api_keys FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = api_keys.project_id 
        AND owner_id = auth.uid()
    )
  );

-- Only owner can delete API key
CREATE POLICY "api_keys_delete"
  ON api_keys FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = api_keys.project_id 
        AND owner_id = auth.uid()
    )
  );

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================

-- Users can view their own subscription
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No direct insert/update/delete by users
-- Managed by Stripe webhooks using service_role key

-- ============================================
-- PUBLIC API ACCESS (via api_keys)
-- ============================================
-- Note: Public Delivery API is handled by Edge Functions
-- Edge Functions use service_role key to bypass RLS
-- and validate api_key manually

-- ============================================
-- SERVICE ROLE BYPASS
-- ============================================
-- Service role automatically bypasses RLS
-- Used for:
--   - Stripe webhook handlers
--   - Delivery API (Edge Functions)
--   - Admin operations


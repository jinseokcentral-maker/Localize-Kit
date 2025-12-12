-- ============================================
-- LocalizeKit - Remove Database Triggers
-- ============================================
-- Run AFTER all other migrations
-- Removes all triggers - these will be handled by backend/Edge Functions logic

-- ============================================
-- REMOVE TRIGGERS
-- ============================================

-- Remove profile auto-creation trigger (handle in backend)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Remove project owner auto-add trigger (handle in backend)
DROP TRIGGER IF EXISTS on_project_created ON projects;
DROP FUNCTION IF EXISTS handle_new_project();

-- Remove translation history trigger (handle in backend)
DROP TRIGGER IF EXISTS on_translation_change ON translations;
DROP FUNCTION IF EXISTS record_translation_history();

-- Remove updated_at triggers (handle in backend)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_translations_updated_at ON translations;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
DROP TRIGGER IF EXISTS update_api_usage_updated_at ON api_usage;

-- Keep helper functions for potential use in Edge Functions
-- update_updated_at() - can be called manually if needed
-- generate_random_username() - can be called manually if needed

COMMENT ON FUNCTION update_updated_at() IS 'Helper function - call manually from backend if needed';
COMMENT ON FUNCTION generate_random_username() IS 'Helper function - call manually from backend if needed';










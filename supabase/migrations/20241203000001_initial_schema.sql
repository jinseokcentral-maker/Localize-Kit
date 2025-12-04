-- ============================================
-- LocalizeKit - Initial Schema
-- ============================================
-- Run in Supabase Studio SQL Editor
-- Order: 00001 → 00002 (RLS)

-- ============================================
-- 1. PROFILES
-- ============================================
-- Extends auth.users with additional info

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles extending auth.users';
COMMENT ON COLUMN profiles.plan IS 'Subscription plan: free, pro, team';

-- ============================================
-- 2. PROJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  default_language TEXT DEFAULT 'en',
  languages TEXT[] DEFAULT ARRAY['en'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_slug ON projects(slug);

COMMENT ON TABLE projects IS 'Translation projects';
COMMENT ON COLUMN projects.slug IS 'URL-friendly identifier for API';
COMMENT ON COLUMN projects.languages IS 'Array of supported language codes';

-- ============================================
-- 3. TEAM_MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_team_members_project_id ON team_members(project_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

COMMENT ON TABLE team_members IS 'Project team members (Team plan)';
COMMENT ON COLUMN team_members.role IS 'owner: full access, editor: edit translations, viewer: read only';
COMMENT ON COLUMN team_members.joined_at IS 'NULL means invitation pending';

-- ============================================
-- 4. TRANSLATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  values JSONB DEFAULT '{}',
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(project_id, key)
);

CREATE INDEX idx_translations_project_id ON translations(project_id);
CREATE INDEX idx_translations_key ON translations(key);
CREATE INDEX idx_translations_values ON translations USING GIN (values);

COMMENT ON TABLE translations IS 'Translation key-value pairs';
COMMENT ON COLUMN translations.key IS 'Translation key, e.g., common.buttons.submit';
COMMENT ON COLUMN translations.values IS 'JSONB: {"en": "Submit", "ko": "제출"}';
COMMENT ON COLUMN translations.context IS 'Description for translators';

-- ============================================
-- 5. TRANSLATION_HISTORY (Pro+)
-- ============================================

CREATE TABLE IF NOT EXISTS translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id UUID NOT NULL REFERENCES translations(id) ON DELETE CASCADE,
  previous_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete'))
);

CREATE INDEX idx_translation_history_translation_id ON translation_history(translation_id);
CREATE INDEX idx_translation_history_changed_at ON translation_history(changed_at DESC);

COMMENT ON TABLE translation_history IS 'Translation change history (Pro plan+)';

-- ============================================
-- 6. API_KEYS
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

COMMENT ON TABLE api_keys IS 'API keys for Delivery API (Pro+)';
COMMENT ON COLUMN api_keys.project_id IS 'One key per project (UNIQUE)';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 chars for display: lk_abc123...';

-- ============================================
-- 7. SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

COMMENT ON TABLE subscriptions IS 'Stripe subscription data';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate random username for Magic Link users
CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
BEGIN
  RETURN 'user_' || substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Get name from OAuth metadata or generate random
  user_name := NEW.raw_user_meta_data->>'full_name';
  
  IF user_name IS NULL OR user_name = '' THEN
    user_name := generate_random_username();
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- AUTO-ADD OWNER TO TEAM_MEMBERS
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically add owner as team member with 'owner' role
  INSERT INTO public.team_members (project_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.owner_id, 'owner', NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_created ON projects;

CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_project();

-- ============================================
-- RECORD TRANSLATION HISTORY (Pro+)
-- ============================================

CREATE OR REPLACE FUNCTION record_translation_history()
RETURNS TRIGGER AS $$
DECLARE
  user_plan TEXT;
BEGIN
  -- Check if user has Pro or Team plan
  SELECT plan INTO user_plan
  FROM profiles
  WHERE id = COALESCE(NEW.updated_by, OLD.updated_by, auth.uid());
  
  -- Only record history for Pro+ users
  IF user_plan IN ('pro', 'team') THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO translation_history (translation_id, new_values, changed_by, change_type)
      VALUES (NEW.id, NEW.values, NEW.updated_by, 'create');
    ELSIF TG_OP = 'UPDATE' AND OLD.values IS DISTINCT FROM NEW.values THEN
      INSERT INTO translation_history (translation_id, previous_values, new_values, changed_by, change_type)
      VALUES (NEW.id, OLD.values, NEW.values, NEW.updated_by, 'update');
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO translation_history (translation_id, previous_values, changed_by, change_type)
      VALUES (OLD.id, OLD.values, auth.uid(), 'delete');
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_translation_change ON translations;

CREATE TRIGGER on_translation_change
  AFTER INSERT OR UPDATE OR DELETE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION record_translation_history();

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


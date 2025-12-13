-- Create teams table for team plan users
-- Teams are organizations that users can belong to
-- Free and Pro users don't have teams (team_id is null)
-- Team plan users must have a team

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT teams_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
);

-- Create team_memberships table
-- Links users to teams (many-to-many relationship)
-- A user can belong to multiple teams, but typically one team per user
CREATE TABLE IF NOT EXISTS public.team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Add team_id to profiles table
-- This is a convenience field to quickly find a user's primary team
-- For team plan users, this should be set
-- For free/pro users, this is null
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team_id ON public.team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user_id ON public.team_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);

-- Add updated_at trigger for teams
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.teams IS 'Teams/organizations for team plan users. Free and Pro users have null team_id.';
COMMENT ON TABLE public.team_memberships IS 'Many-to-many relationship between users and teams. Users can belong to multiple teams.';
COMMENT ON COLUMN public.profiles.team_id IS 'Primary team ID for the user. Null for free/pro users, set for team plan users.';


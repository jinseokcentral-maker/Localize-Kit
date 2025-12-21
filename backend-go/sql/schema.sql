-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    plan TEXT,
    stripe_customer_id TEXT,
    team_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    avatar_url TEXT,
    personal BOOLEAN DEFAULT FALSE NOT NULL
);

-- Team memberships table
CREATE TABLE team_memberships (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL,
    joined_at TIMESTAMP,
    created_at TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    owner_id UUID NOT NULL,
    default_language TEXT,
    languages TEXT[],
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMP,
    archived BOOLEAN DEFAULT FALSE NOT NULL
);

-- Team members table (project members)
CREATE TABLE team_members (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL,
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,
    invited_by UUID,
    created_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_profiles_team_id ON profiles(team_id);
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_team_memberships_team_id ON team_memberships(team_id);
CREATE INDEX idx_team_memberships_user_id ON team_memberships(user_id);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_team_members_project_id ON team_members(project_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);


-- Add personal flag to teams table to distinguish personal teams from organization teams

ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS personal BOOLEAN DEFAULT FALSE NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.teams.personal IS 'Whether this is a personal team (true) or an organization team (false). Personal teams are typically single-user teams.';


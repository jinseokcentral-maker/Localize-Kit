-- Add avatar_url to teams table for team profile image

ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.teams.avatar_url IS 'Team profile/avatar image URL. NULL if no image is set.';


-- Add soft delete and archived status to projects table

-- Add is_deleted flag for soft delete
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;

-- Add deleted_at timestamp for soft delete tracking
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add archived status flag
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for filtering active (non-deleted) projects
CREATE INDEX IF NOT EXISTS idx_projects_is_deleted ON public.projects(is_deleted) WHERE is_deleted = FALSE;

-- Create index for filtering archived projects
CREATE INDEX IF NOT EXISTS idx_projects_archived ON public.projects(archived);

-- Create composite index for common queries (active, non-archived projects)
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(is_deleted, archived) WHERE is_deleted = FALSE AND archived = FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.projects.is_deleted IS 'Soft delete flag. When true, project is considered deleted but data is preserved.';
COMMENT ON COLUMN public.projects.deleted_at IS 'Timestamp when project was soft deleted. NULL if not deleted.';
COMMENT ON COLUMN public.projects.archived IS 'Archived status. When true, project is archived but still accessible.';


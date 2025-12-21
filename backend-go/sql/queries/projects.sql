-- name: GetProjectByID :one
SELECT * FROM projects WHERE id = $1 AND is_deleted = false;

-- name: CreateProject :one
INSERT INTO projects (
    id, name, description, slug, owner_id, default_language, languages,
    created_at, updated_at, is_deleted, archived
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: UpdateProject :one
UPDATE projects
SET 
    name = COALESCE(sqlc.narg('name'), name),
    description = COALESCE(sqlc.narg('description'), description),
    default_language = COALESCE(sqlc.narg('default_language'), default_language),
    languages = COALESCE(sqlc.narg('languages'), languages),
    slug = COALESCE(sqlc.narg('slug'), slug),
    updated_at = $2
WHERE id = $1 AND is_deleted = false
RETURNING *;

-- name: GetProjectsByOwnerID :many
SELECT * FROM projects WHERE owner_id = $1 AND is_deleted = false;

-- name: GetProjectsByIDs :many
SELECT * FROM projects WHERE id = ANY($1::UUID[]) AND is_deleted = false;

-- name: CountProjectsByOwnerID :one
SELECT COUNT(*) FROM projects WHERE owner_id = $1 AND is_deleted = false;


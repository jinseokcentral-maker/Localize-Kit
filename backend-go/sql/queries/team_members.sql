-- name: GetTeamMembersByUserID :many
SELECT * FROM team_members WHERE user_id = $1;

-- name: GetTeamMemberByProjectAndUser :one
SELECT * FROM team_members WHERE project_id = $1 AND user_id = $2;

-- name: CreateTeamMember :one
INSERT INTO team_members (
    id, project_id, user_id, role, invited_at, joined_at, invited_by, created_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: DeleteTeamMember :exec
DELETE FROM team_members WHERE project_id = $1 AND user_id = $2;


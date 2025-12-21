-- name: GetTeamByID :one
SELECT * FROM teams WHERE id = $1;

-- name: GetTeamByIDAndPersonal :one
SELECT * FROM teams WHERE id = $1 AND personal = $2;

-- name: CreateTeam :one
INSERT INTO teams (id, name, owner_id, avatar_url, personal, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetTeamsByIDs :many
SELECT id, name, owner_id, created_at, updated_at, avatar_url, personal FROM teams WHERE id = ANY($1::UUID[]);

-- name: GetTeamMembershipCount :one
SELECT COUNT(*) FROM team_memberships WHERE team_id = $1;

-- name: GetPersonalTeamByUserID :one
SELECT t.id, t.name, t.owner_id, t.created_at, t.updated_at, t.avatar_url, t.personal FROM teams t JOIN profiles p ON t.id = p.team_id WHERE p.id = $1 AND t.personal = TRUE;


-- name: GetTeamMembershipByUserAndTeam :one
SELECT * FROM team_memberships WHERE user_id = $1 AND team_id = $2;

-- name: GetTeamMembershipsByUserID :many
SELECT * FROM team_memberships WHERE user_id = $1;

-- name: CreateTeamMembership :one
INSERT INTO team_memberships (id, team_id, user_id, role, joined_at, created_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetTeamMembershipsByTeamIDs :many
SELECT * FROM team_memberships WHERE team_id = ANY($1::UUID[]);


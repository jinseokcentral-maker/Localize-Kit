-- name: GetProfileByID :one
SELECT * FROM profiles WHERE id = $1;

-- name: CreateProfile :one
INSERT INTO profiles (id, email, full_name, avatar_url, plan, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateProfile :one
UPDATE profiles
SET 
    full_name = COALESCE($3, full_name),
    avatar_url = COALESCE($4, avatar_url),
    plan = COALESCE($5, plan),
    updated_at = $2
WHERE id = $1
RETURNING *;

-- name: UpdateProfileTeamID :one
UPDATE profiles
SET team_id = $2, updated_at = $3
WHERE id = $1
RETURNING *;


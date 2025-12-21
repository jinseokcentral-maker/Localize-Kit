package team

import (
	"backend-go/internal/common/errors"
	db "backend-go/internal/database/queries"
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service struct {
	db *db.Queries
}

func NewService(dbQueries *db.Queries) *Service {
	return &Service{
		db: dbQueries,
	}
}

func (s *Service) CreateTeam(ctx context.Context, userID string, input CreateTeamRequest) (*Team, error) {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(userID); err != nil {
		return nil, &errors.InvalidTeamError{TeamID: userID}
	}

	now := time.Now()
	nowTimestamp := pgtype.Timestamp{Time: now, Valid: true}

	var avatarURL pgtype.Text
	if input.AvatarURL != nil && *input.AvatarURL != "" {
		avatarURL = pgtype.Text{String: *input.AvatarURL, Valid: true}
	}

	newUUID := uuid.New()
	teamUUID := pgtype.UUID{}
	if err := teamUUID.Scan(newUUID.String()); err != nil {
		return nil, fmt.Errorf("failed to generate team ID: %w", err)
	}

	team, err := s.db.CreateTeam(ctx, db.CreateTeamParams{
		ID:        teamUUID,
		Name:      input.Name,
		OwnerID:   userUUID,
		AvatarUrl: avatarURL,
		Personal:  false,
		CreatedAt: nowTimestamp,
		UpdatedAt: nowTimestamp,
	})

	if err != nil {
		return nil, &errors.InvalidTeamError{TeamID: userID}
	}

	// Create team membership for owner
	membershipUUID := pgtype.UUID{}
	membershipNewUUID := uuid.New()
	if err := membershipUUID.Scan(membershipNewUUID.String()); err != nil {
		return nil, fmt.Errorf("failed to generate membership ID: %w", err)
	}

	_, err = s.db.CreateTeamMembership(ctx, db.CreateTeamMembershipParams{
		ID:        membershipUUID,
		TeamID:    team.ID,
		UserID:    userUUID,
		Role:      "owner",
		JoinedAt:  nowTimestamp,
		CreatedAt: nowTimestamp,
	})

	if err != nil {
		return nil, &errors.InvalidTeamError{TeamID: userID}
	}

	return s.mapTeam(team), nil
}

func (s *Service) mapTeam(t db.Team) *Team {
	team := &Team{
		ID:       uuidToString(t.ID),
		Name:     t.Name,
		OwnerID:  uuidToString(t.OwnerID),
		Personal: t.Personal,
	}

	if t.AvatarUrl.Valid {
		team.AvatarURL = &t.AvatarUrl.String
	}

	if t.CreatedAt.Valid {
		ts := t.CreatedAt.Time.Format(time.RFC3339)
		team.CreatedAt = &ts
	}

	if t.UpdatedAt.Valid {
		ts := t.UpdatedAt.Time.Format(time.RFC3339)
		team.UpdatedAt = &ts
	}

	return team
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	var id [16]byte
	copy(id[:], u.Bytes[:])
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%12x", id[0:4], id[4:6], id[6:8], id[8:10], id[10:16])
}


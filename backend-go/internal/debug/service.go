package debug

import (
	"backend-go/internal/common/errors"
	db "backend-go/internal/database/queries"
	"context"
	"database/sql"
	"fmt"
	"time"

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

func (s *Service) UpdateUserPlan(ctx context.Context, targetUserID string, plan string) error {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(targetUserID); err != nil {
		return &errors.UserNotFoundError{}
	}

	// Get profile
	profile, err := s.db.GetProfileByID(ctx, userUUID)
	if err != nil {
		if err == sql.ErrNoRows {
			return &errors.UserNotFoundError{}
		}
		return fmt.Errorf("failed to get profile: %w", err)
	}

	// Update plan
	planText := pgtype.Text{String: plan, Valid: true}
	nowTimestamp := pgtype.Timestamp{Time: time.Now(), Valid: true}
	_, err = s.db.UpdateProfile(ctx, db.UpdateProfileParams{
		ID:        profile.ID,
		UpdatedAt: nowTimestamp,
		Plan:      planText,
	})
	if err != nil {
		return fmt.Errorf("failed to update plan: %w", err)
	}

	return nil
}


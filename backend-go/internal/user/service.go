package user

import (
	"backend-go/internal/common/errors"
	db "backend-go/internal/database/queries"
	"backend-go/internal/project/plan"
	"context"
	"database/sql"
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

func (s *Service) RegisterUser(ctx context.Context, input RegisterUserRequest) (*User, error) {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(input.ID); err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	now := time.Now()
	nowTimestamp := pgtype.Timestamp{Time: now, Valid: true}

	var email pgtype.Text
	if input.Email != "" {
		email = pgtype.Text{String: input.Email, Valid: true}
	}

	var fullName pgtype.Text
	if input.FullName != nil && *input.FullName != "" {
		fullName = pgtype.Text{String: *input.FullName, Valid: true}
	}

	var avatarURL pgtype.Text
	if input.AvatarURL != nil && *input.AvatarURL != "" {
		avatarURL = pgtype.Text{String: *input.AvatarURL, Valid: true}
	}

	planText := pgtype.Text{String: "free", Valid: true}
	if input.Plan != nil && *input.Plan != "" {
		planText = pgtype.Text{String: *input.Plan, Valid: true}
	}

	// Create profile
	profile, err := s.db.CreateProfile(ctx, db.CreateProfileParams{
		ID:        userUUID,
		Email:     email,
		FullName:  fullName,
		AvatarUrl: avatarURL,
		Plan:      planText,
		CreatedAt: nowTimestamp,
		UpdatedAt: nowTimestamp,
	})

	if err != nil {
		// Check for duplicate key error
		if err.Error() == "duplicate key value violates unique constraint" {
			return nil, &errors.UserConflictError{Reason: err.Error()}
		}
		return nil, &errors.UserConflictError{Reason: fmt.Sprintf("Failed to create user: %v", err)}
	}

	// Create personal team
	teamName := "My Team"
	if fullName.Valid {
		teamName = fullName.String
	}

	newUUID := uuid.New()
	teamUUID := pgtype.UUID{}
	if err := teamUUID.Scan(newUUID.String()); err != nil {
		return nil, fmt.Errorf("failed to generate team ID: %w", err)
	}

	team, err := s.db.CreateTeam(ctx, db.CreateTeamParams{
		ID:        teamUUID,
		Name:      teamName,
		OwnerID:   userUUID,
		AvatarUrl: avatarURL,
		Personal:  true,
		CreatedAt: nowTimestamp,
		UpdatedAt: nowTimestamp,
	})

	if err != nil {
		return nil, &errors.PersonalTeamNotFoundError{UserID: input.ID}
	}

	// Update profile with team_id
	_, err = s.db.UpdateProfileTeamID(ctx, db.UpdateProfileTeamIDParams{
		ID:        userUUID,
		TeamID:    team.ID,
		UpdatedAt: nowTimestamp,
	})

	if err != nil {
		return nil, &errors.PersonalTeamNotFoundError{UserID: input.ID}
	}

	// Create team membership
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
		return nil, &errors.PersonalTeamNotFoundError{UserID: input.ID}
	}

	teams, err := s.getTeamsInfo(ctx, userUUID, profile)
	if err != nil {
		return nil, err
	}
	return s.mapProfileToUser(profile, teams), nil
}

func (s *Service) GetUserById(ctx context.Context, userID string, activeTeamID *string) (*User, error) {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(userID); err != nil {
		return nil, &errors.UserNotFoundError{}
	}

	profile, err := s.db.GetProfileByID(ctx, userUUID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, &errors.UserNotFoundError{}
		}
		return nil, &errors.UserNotFoundError{}
	}

	// Get teams info
	teams, err := s.getTeamsInfo(ctx, userUUID, profile)
	if err != nil {
		return nil, err
	}

	user := s.mapProfileToUser(profile, teams)

	// Set activeTeamID
	if activeTeamID != nil && *activeTeamID != "" {
		user.ActiveTeamID = activeTeamID
	} else {
		// Find personal team
		for _, team := range teams {
			if team.Personal {
				user.ActiveTeamID = &team.TeamID
				break
			}
		}
	}

	return user, nil
}

func (s *Service) UpdateUser(ctx context.Context, userID string, input UpdateUserRequest) (*User, error) {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(userID); err != nil {
		return nil, &errors.UserNotFoundError{}
	}

	_, err := s.db.GetProfileByID(ctx, userUUID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, &errors.UserNotFoundError{}
		}
		return nil, &errors.UserNotFoundError{}
	}

	now := time.Now()
	nowTimestamp := pgtype.Timestamp{Time: now, Valid: true}

	var fullName pgtype.Text
	if input.FullName != nil {
		fullName = pgtype.Text{String: *input.FullName, Valid: true}
	}

	var avatarURL pgtype.Text
	if input.AvatarURL != nil {
		avatarURL = pgtype.Text{String: *input.AvatarURL, Valid: true}
	}

	var planText pgtype.Text
	if input.Plan != nil {
		planText = pgtype.Text{String: *input.Plan, Valid: true}
	}

	updatedProfile, err := s.db.UpdateProfile(ctx, db.UpdateProfileParams{
		ID:        userUUID,
		UpdatedAt: nowTimestamp,
		FullName:  fullName,
		AvatarUrl: avatarURL,
		Plan:      planText,
	})

	if err != nil {
		return nil, &errors.UserNotFoundError{}
	}

	teams, err := s.getTeamsInfo(ctx, userUUID, updatedProfile)
	if err != nil {
		return nil, err
	}

	return s.mapProfileToUser(updatedProfile, teams), nil
}

func (s *Service) getTeamsInfo(ctx context.Context, userID pgtype.UUID, profile db.Profile) ([]TeamInfo, error) {
	// Count projects
	projectCount, err := s.db.CountProjectsByOwnerID(ctx, userID)
	if err != nil {
		projectCount = 0
	}

	planNameStr := "free"
	if profile.Plan.Valid {
		planNameStr = profile.Plan.String
	}
	planName := plan.PlanName(planNameStr)

	canCreate := plan.CanCreateProject(planName, int(projectCount))

	// Get team memberships
	memberships, err := s.db.GetTeamMembershipsByUserID(ctx, userID)
	if err != nil {
		// If no memberships, try to get personal team
		if !profile.TeamID.Valid {
			return nil, &errors.PersonalTeamNotFoundError{UserID: uuidToString(userID)}
		}

		team, err := s.db.GetTeamByIDAndPersonal(ctx, db.GetTeamByIDAndPersonalParams{
			ID:       profile.TeamID,
			Personal: true,
		})

		if err != nil {
			return nil, &errors.PersonalTeamNotFoundError{UserID: uuidToString(userID)}
		}

		memberCount, _ := s.db.GetTeamMembershipCount(ctx, team.ID)

		return []TeamInfo{
			{
				TeamID:          uuidToString(team.ID),
				ProjectCount:    int(projectCount),
				Plan:            planNameStr,
				CanCreateProject: canCreate,
				TeamName:        team.Name,
				MemberCount:     int(memberCount),
				AvatarURL:       textToPtr(team.AvatarUrl),
				Personal:        team.Personal,
			},
		}, nil
	}

	// Get teams
	teamIDs := make([]pgtype.UUID, len(memberships))
	for i, m := range memberships {
		teamIDs[i] = m.TeamID
	}

	teams, err := s.db.GetTeamsByIDs(ctx, teamIDs)
	if err != nil {
		return nil, &errors.PersonalTeamNotFoundError{UserID: uuidToString(userID)}
	}

	teamInfos := make([]TeamInfo, len(teams))
	for i, team := range teams {
		memberCount, _ := s.db.GetTeamMembershipCount(ctx, team.ID)
		teamInfos[i] = TeamInfo{
			TeamID:          uuidToString(team.ID),
			ProjectCount:    int(projectCount),
			Plan:            planNameStr,
			CanCreateProject: canCreate,
			TeamName:        team.Name,
			MemberCount:     int(memberCount),
			AvatarURL:       textToPtr(team.AvatarUrl),
			Personal:        team.Personal,
		}
	}

	return teamInfos, nil
}

func (s *Service) mapProfileToUser(profile db.Profile, teams []TeamInfo) *User {
	user := &User{
		ID:        uuidToString(profile.ID),
		Email:     textToPtr(profile.Email),
		FullName:  textToPtr(profile.FullName),
		AvatarURL: textToPtr(profile.AvatarUrl),
		Plan:      textToPtr(profile.Plan),
		Teams:     teams,
	}

	if profile.CreatedAt.Valid {
		ts := profile.CreatedAt.Time.Format(time.RFC3339)
		user.CreatedAt = &ts
	}

	if profile.UpdatedAt.Valid {
		ts := profile.UpdatedAt.Time.Format(time.RFC3339)
		user.UpdatedAt = &ts
	}

	return user
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	var id [16]byte
	copy(id[:], u.Bytes[:])
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%12x", id[0:4], id[4:6], id[6:8], id[8:10], id[10:16])
}

func textToPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}



package auth

import (
	"backend-go/internal/common/errors"
	db "backend-go/internal/database/queries"
	"backend-go/internal/supabase"
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// uuidToString converts pgtype.UUID to string
func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	// pgtype.UUID.Bytes is [16]byte, convert to standard uuid format
	var id [16]byte
	copy(id[:], u.Bytes[:])
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%12x", id[0:4], id[4:6], id[6:8], id[8:10], id[10:16])
}

type Service struct {
	db                  *db.Queries
	supabase            *supabase.Client
	jwtSecret           string
	jwtExpiresIn        string
	jwtRefreshExpiresIn string
}

func NewService(dbQueries *db.Queries, supabaseClient *supabase.Client, jwtSecret, jwtExpiresIn, jwtRefreshExpiresIn string) *Service {
	return &Service{
		db:                  dbQueries,
		supabase:            supabaseClient,
		jwtSecret:           jwtSecret,
		jwtExpiresIn:        jwtExpiresIn,
		jwtRefreshExpiresIn: jwtRefreshExpiresIn,
	}
}

func (s *Service) LoginWithGoogleAccessToken(ctx context.Context, accessToken string, teamID *string) (*TokenPair, error) {
	// Verify user with Supabase
	supabaseUser, err := s.supabase.GetUser(ctx, accessToken)
	if err != nil {
		return nil, &errors.ProviderAuthError{Message: fmt.Sprintf("Provider authentication failed: %v", err)}
	}

	// Find or create user in database
	userID := pgtype.UUID{}
	if err := userID.Scan(supabaseUser.ID); err != nil {
		return nil, &errors.ProviderAuthError{Message: "Invalid user ID"}
	}

	profile, err := s.db.GetProfileByID(ctx, userID)
	if err != nil {
		// User doesn't exist, create new user
		if err == sql.ErrNoRows {
			return s.createNewUser(ctx, supabaseUser, teamID)
		}
		return nil, &errors.ProviderAuthError{Message: fmt.Sprintf("Database error: %v", err)}
	}

	// User exists, verify team membership if teamID provided
	if teamID != nil {
		teamUUID := pgtype.UUID{}
		if err := teamUUID.Scan(*teamID); err != nil {
			return nil, &errors.InvalidTeamError{TeamID: *teamID}
		}

		if err := s.verifyTeamMembership(ctx, userID, teamUUID); err != nil {
			return nil, err
		}

		teamIDStr := *teamID
		return s.issueTokens(profile, &teamIDStr), nil
	}

	// No teamID provided, use personal team
	personalTeamID, err := s.getPersonalTeamID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return s.issueTokens(profile, personalTeamID), nil
}

func (s *Service) RefreshTokens(ctx context.Context, refreshToken string) (*TokenPair, error) {
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, &errors.InvalidTokenError{Reason: err.Error()}
	}

	if !token.Valid {
		return nil, &errors.InvalidTokenError{Reason: "token is not valid"}
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, &errors.InvalidTokenError{Reason: "invalid token claims"}
	}

	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		return nil, &errors.InvalidTokenError{Reason: "missing sub claim"}
	}

	userID := pgtype.UUID{}
	if err := userID.Scan(sub); err != nil {
		return nil, &errors.InvalidTokenError{Reason: "invalid user ID in token"}
	}

	profile, err := s.db.GetProfileByID(ctx, userID)
	if err != nil {
		return nil, &errors.InvalidTokenError{Reason: "user not found"}
	}

	var teamID *string
	if t, ok := claims["teamId"].(string); ok && t != "" {
		teamID = &t
	}

	return s.issueTokens(profile, teamID), nil
}

func (s *Service) SwitchTeam(ctx context.Context, userID pgtype.UUID, teamID string) (*TokenPair, error) {
	teamUUID := pgtype.UUID{}
	if err := teamUUID.Scan(teamID); err != nil {
		return nil, &errors.InvalidTeamError{TeamID: teamID}
	}

	// Verify team exists and membership
	_, err := s.db.GetTeamByID(ctx, teamUUID)
	if err != nil {
		return nil, &errors.InvalidTeamError{TeamID: teamID}
	}

	// Verify team membership
	if err := s.verifyTeamMembership(ctx, userID, teamUUID); err != nil {
		return nil, err
	}

	profile, err := s.db.GetProfileByID(ctx, userID)
	if err != nil {
		return nil, &errors.UnauthorizedError{Reason: "user not found"}
	}

	return s.issueTokens(profile, &teamID), nil
}

func (s *Service) createNewUser(ctx context.Context, supabaseUser *supabase.User, teamID *string) (*TokenPair, error) {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(supabaseUser.ID); err != nil {
		return nil, &errors.ProviderAuthError{Message: "Invalid user ID"}
	}

	now := time.Now()
	nowTimestamp := pgtype.Timestamp{Time: now, Valid: true}

	var email pgtype.Text
	if supabaseUser.Email != "" {
		email = pgtype.Text{String: supabaseUser.Email, Valid: true}
	}

	var fullName pgtype.Text
	if metadata := supabaseUser.Metadata; metadata != nil {
		if name, ok := metadata["full_name"].(string); ok && name != "" {
			fullName = pgtype.Text{String: name, Valid: true}
		} else if name, ok := metadata["name"].(string); ok && name != "" {
			fullName = pgtype.Text{String: name, Valid: true}
		}
	}

	var avatarURL pgtype.Text
	if metadata := supabaseUser.Metadata; metadata != nil {
		if url, ok := metadata["avatar_url"].(string); ok && url != "" {
			avatarURL = pgtype.Text{String: url, Valid: true}
		} else if pic, ok := metadata["picture"].(string); ok && pic != "" {
			avatarURL = pgtype.Text{String: pic, Valid: true}
		}
	}

	plan := pgtype.Text{String: "free", Valid: true}

	profile, err := s.db.CreateProfile(ctx, db.CreateProfileParams{
		ID:        userUUID,
		Email:     email,
		FullName:  fullName,
		AvatarUrl: avatarURL,
		Plan:      plan,
		CreatedAt: nowTimestamp,
		UpdatedAt: nowTimestamp,
	})

	if err != nil {
		return nil, &errors.ProviderAuthError{Message: fmt.Sprintf("Failed to create user: %v", err)}
	}

	if teamID != nil {
		teamUUID := pgtype.UUID{}
		if err := teamUUID.Scan(*teamID); err != nil {
			return nil, &errors.InvalidTeamError{TeamID: *teamID}
		}

		if err := s.verifyTeamMembership(ctx, userUUID, teamUUID); err != nil {
			return nil, err
		}

		return s.issueTokens(profile, teamID), nil
	}

	return s.issueTokens(profile, nil), nil
}

func (s *Service) verifyTeamMembership(ctx context.Context, userID, teamID pgtype.UUID) error {
	_, err := s.db.GetTeamByID(ctx, teamID)
	if err != nil {
		return &errors.InvalidTeamError{TeamID: uuidToString(teamID)}
	}

	_, err = s.db.GetTeamMembershipByUserAndTeam(ctx, db.GetTeamMembershipByUserAndTeamParams{
		UserID: userID,
		TeamID: teamID,
	})

	if err != nil {
		if err == sql.ErrNoRows {
			return &errors.TeamAccessForbiddenError{
				UserID: uuidToString(userID),
				TeamID: uuidToString(teamID),
			}
		}
		return err
	}

	return nil
}

func (s *Service) getPersonalTeamID(ctx context.Context, userID pgtype.UUID) (*string, error) {
	// Try to get personal team by user ID
	team, err := s.db.GetPersonalTeamByUserID(ctx, userID)
	if err != nil {
		// If no personal team found, return nil (no error)
		return nil, nil
	}

	teamIDStr := uuidToString(team.ID)
	return &teamIDStr, nil
}

func (s *Service) issueTokens(profile db.Profile, teamID *string) *TokenPair {
	now := time.Now()

	claims := jwt.MapClaims{
		"sub": uuidToString(profile.ID),
	}

	if profile.Email.Valid {
		claims["email"] = profile.Email.String
	}

	if profile.Plan.Valid {
		claims["plan"] = profile.Plan.String
	}

	if teamID != nil {
		claims["teamId"] = *teamID
	}

	// Access token
	accessTokenExpires := now.Add(parseDuration(s.jwtExpiresIn))
	claims["exp"] = accessTokenExpires.Unix()
	claims["iat"] = now.Unix()

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessTokenString, _ := accessToken.SignedString([]byte(s.jwtSecret))

	// Refresh token
	refreshClaims := jwt.MapClaims{
		"sub": uuidToString(profile.ID),
	}
	if profile.Email.Valid {
		refreshClaims["email"] = profile.Email.String
	}
	if teamID != nil {
		refreshClaims["teamId"] = *teamID
	}

	refreshTokenExpires := now.Add(parseDuration(s.jwtRefreshExpiresIn))
	refreshClaims["exp"] = refreshTokenExpires.Unix()
	refreshClaims["iat"] = now.Unix()

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, _ := refreshToken.SignedString([]byte(s.jwtSecret))

	return &TokenPair{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
	}
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		// Default to 15 minutes
		return 15 * time.Minute
	}
	return d
}

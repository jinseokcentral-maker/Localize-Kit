package auth

// ProviderLoginRequest represents the login request
// @Description Provider access token payload
type ProviderLoginRequest struct {
	AccessToken string  `json:"accessToken" validate:"required,min=1"`
	TeamID      *string `json:"teamId,omitempty" validate:"omitempty,uuid"`
}

// RefreshTokensRequest represents the refresh token request
// @Description Refresh token payload
type RefreshTokensRequest struct {
	RefreshToken string `json:"refreshToken" validate:"required"`
}

// SwitchTeamRequest represents the switch team request
// @Description Switch team payload
type SwitchTeamRequest struct {
	TeamID string `json:"teamId" validate:"required,uuid"`
}

// TokenPair represents the access and refresh tokens
// @Description Token pair response
type TokenPair struct {
	AccessToken  string `json:"accessToken" example:"eyJhbGciOiJSUzI1NiIs..."`
	RefreshToken string `json:"refreshToken" example:"eyJhbGciOiJSUzI1NiIs..."`
}

// TokenPairResponse represents the token pair wrapped in envelope
// @Description Token pair wrapped in response envelope
type TokenPairResponse struct {
	Data      TokenPair `json:"data"`
	Timestamp string    `json:"timestamp"`
}

type JwtPayload struct {
	Sub    string  `json:"sub"`
	Email  *string `json:"email,omitempty"`
	Plan   *string `json:"plan,omitempty"`
	TeamID *string `json:"teamId,omitempty"`
	Exp    *int64  `json:"exp,omitempty"`
	Iat    *int64  `json:"iat,omitempty"`
}


package user

// RegisterUserRequest represents user registration request
// @Description User registration payload
type RegisterUserRequest struct {
	ID        string  `json:"id" validate:"required,uuid"`
	Email     string  `json:"email" validate:"required,email"`
	FullName  *string `json:"fullName,omitempty"`
	AvatarURL *string `json:"avatarUrl,omitempty" validate:"omitempty,url"`
	Plan      *string `json:"plan,omitempty"`
}

// UpdateUserRequest represents user update request
// @Description User update payload
type UpdateUserRequest struct {
	FullName  *string `json:"fullName,omitempty"`
	AvatarURL *string `json:"avatarUrl,omitempty" validate:"omitempty,url"`
	Plan      *string `json:"plan,omitempty"`
}

// User represents a user profile
// @Description User profile
type User struct {
	ID          string    `json:"id"`
	Email       *string   `json:"email,omitempty"`
	FullName    *string   `json:"fullName,omitempty"`
	AvatarURL   *string   `json:"avatarUrl,omitempty"`
	Plan        *string   `json:"plan,omitempty"`
	CreatedAt   *string   `json:"createdAt,omitempty"`
	UpdatedAt   *string   `json:"updatedAt,omitempty"`
	Teams       []TeamInfo `json:"teams"`
	ActiveTeamID *string   `json:"activeTeamId,omitempty"`
}

// TeamInfo represents team information
// @Description Team information
type TeamInfo struct {
	TeamID         string  `json:"teamId"`
	ProjectCount   int     `json:"projectCount"`
	Plan           string  `json:"plan"`
	CanCreateProject bool  `json:"canCreateProject"`
	TeamName       string  `json:"teamName"`
	MemberCount    int     `json:"memberCount"`
	AvatarURL      *string `json:"avatarUrl,omitempty"`
	Personal       bool    `json:"personal"`
}

// RegisterUserResponse represents the registration response
// @Description Created user and JWT token
type RegisterUserResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"accessToken" example:"eyJhbGciOiJSUzI1NiIs..."`
	RefreshToken string `json:"refreshToken" example:"eyJhbGciOiJSUzI1NiIs..."`
}

// UserResponse represents user wrapped in response envelope
// @Description User wrapped in response envelope
type UserResponse struct {
	Data      User   `json:"data"`
	Timestamp string `json:"timestamp"`
}

// RegisterUserResponseWrapper represents registration response wrapped in envelope
// @Description Registration response wrapped in response envelope
type RegisterUserResponseWrapper struct {
	Data      RegisterUserResponse `json:"data"`
	Timestamp string               `json:"timestamp"`
}


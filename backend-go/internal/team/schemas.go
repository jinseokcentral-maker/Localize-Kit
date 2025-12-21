package team

// CreateTeamRequest represents team creation request
// @Description Team creation payload
type CreateTeamRequest struct {
	Name      string  `json:"name" validate:"required,min=1"`
	AvatarURL *string `json:"avatarUrl,omitempty" validate:"omitempty,url"`
}

// Team represents a team
// @Description Team details
type Team struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	OwnerID   string    `json:"ownerId"`
	AvatarURL *string   `json:"avatarUrl,omitempty"`
	Personal  bool      `json:"personal"`
	CreatedAt *string   `json:"createdAt,omitempty"`
	UpdatedAt *string   `json:"updatedAt,omitempty"`
}

// TeamResponse represents team wrapped in response envelope
// @Description Team wrapped in response envelope
type TeamResponse struct {
	Data      Team   `json:"data"`
	Timestamp string `json:"timestamp"`
}


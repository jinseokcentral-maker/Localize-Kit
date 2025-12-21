package debug

// UpdateUserPlanRequest represents update user plan request
// @Description Update plan payload (debug only)
type UpdateUserPlanRequest struct {
	Plan   string  `json:"plan" validate:"required,oneof=free pro"`
	UserID *string `json:"userId,omitempty" validate:"omitempty,uuid"`
}

// UpdateUserPlanResponse represents update user plan response
// @Description Plan updated response
type UpdateUserPlanResponse struct {
	Success bool `json:"success" example:"true"`
}

// UpdateUserPlanResponseWrapper represents update user plan response wrapped in envelope
// @Description Update user plan response wrapped in response envelope
type UpdateUserPlanResponseWrapper struct {
	Data      UpdateUserPlanResponse `json:"data"`
	Timestamp string                 `json:"timestamp"`
}


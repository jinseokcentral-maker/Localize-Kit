package project

// CreateProjectRequest represents project creation request
// @Description Project creation payload
type CreateProjectRequest struct {
	Name           string   `json:"name" validate:"required,min=1"`
	Description    *string  `json:"description,omitempty"`
	Slug           *string  `json:"slug,omitempty"`
	DefaultLanguage *string `json:"defaultLanguage,omitempty"`
	Languages      []string `json:"languages,omitempty"`
}

// UpdateProjectRequest represents project update request
// @Description Project update payload
type UpdateProjectRequest struct {
	Name           *string  `json:"name,omitempty" validate:"omitempty,min=1"`
	Description    *string  `json:"description,omitempty"`
	Slug           *string  `json:"slug,omitempty"`
	DefaultLanguage *string `json:"defaultLanguage,omitempty"`
	Languages      []string `json:"languages,omitempty"`
}

// ListProjectsRequest represents project list request
// @Description Project list query parameters
type ListProjectsRequest struct {
	PageSize int    `query:"pageSize" validate:"omitempty,min=1"`
	Index    int    `query:"index" validate:"omitempty,min=0"`
	Search   string `query:"search"`
	Status   string `query:"status" validate:"omitempty,oneof=active archived"`
	Sort     string `query:"sort" validate:"omitempty,oneof=newest oldest"`
}

// AddMemberRequest represents add member request
// @Description Add member payload
type AddMemberRequest struct {
	UserID string `json:"userId" validate:"required,uuid"`
	Role   string `json:"role" validate:"required,oneof=owner editor viewer"`
}

// RemoveMemberRequest represents remove member request
// @Description Remove member payload
type RemoveMemberRequest struct {
	UserID string `json:"userId" validate:"required,uuid"`
}

// Project represents a project
// @Description Project details
type Project struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Description     *string   `json:"description,omitempty"`
	Slug            string    `json:"slug"`
	OwnerID         string    `json:"ownerId"`
	DefaultLanguage *string   `json:"defaultLanguage,omitempty"`
	Languages       []string  `json:"languages,omitempty"`
	CreatedAt       *string   `json:"createdAt,omitempty"`
	UpdatedAt       *string   `json:"updatedAt,omitempty"`
	Archived        bool      `json:"archived"`
}

// ListProjectsResponse represents project list response
// @Description Project list response
type ListProjectsResponse struct {
	Items []Project      `json:"items"`
	Meta  ListProjectsMeta `json:"meta"`
}

// ProjectResponse represents project wrapped in response envelope
// @Description Project wrapped in response envelope
type ProjectResponse struct {
	Data      Project `json:"data"`
	Timestamp string  `json:"timestamp"`
}

// ListProjectsResponseWrapper represents project list wrapped in response envelope
// @Description Project list wrapped in response envelope
type ListProjectsResponseWrapper struct {
	Data      ListProjectsResponse `json:"data"`
	Timestamp string               `json:"timestamp"`
}

// ListProjectsMeta represents pagination metadata
// @Description Pagination metadata
type ListProjectsMeta struct {
	Index        int  `json:"index"`
	PageSize     int  `json:"pageSize"`
	HasNext      bool `json:"hasNext"`
	TotalCount   int  `json:"totalCount"`
	TotalPageCount int `json:"totalPageCount"`
}


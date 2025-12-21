package project

import (
	"backend-go/internal/common/errors"
	db "backend-go/internal/database/queries"
	"backend-go/internal/project/plan"
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	DEFAULT_LANGUAGE = "en"
	SLUG_REGEX       = "^[a-z0-9-]+$"
)

type Service struct {
	db *db.Queries
}

func NewService(dbQueries *db.Queries) *Service {
	return &Service{
		db: dbQueries,
	}
}

func (s *Service) CreateProject(ctx context.Context, userID string, input CreateProjectRequest, planName string) (*Project, error) {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(userID); err != nil {
		return nil, &errors.ProjectNotFoundError{}
	}

	// Check plan limit
	projectCount, err := s.db.CountProjectsByOwnerID(ctx, userUUID)
	if err != nil {
		projectCount = 0
	}

	if !plan.CanCreateProject(plan.PlanName(planName), int(projectCount)) {
		limit := plan.GetProjectLimit(plan.PlanName(planName))
		return nil, &errors.ForbiddenProjectAccessError{
			Plan:         planName,
			CurrentCount: int(projectCount),
			Limit:        limit,
		}
	}

	// Normalize slug
	slugInput := ""
	if input.Slug != nil {
		slugInput = *input.Slug
	}
	slug := normalizeSlug(slugInput, input.Name)
	if err := validateSlug(slug); err != nil {
		return nil, err
	}

	defaultLang := DEFAULT_LANGUAGE
	if input.DefaultLanguage != nil {
		defaultLang = *input.DefaultLanguage
	}

	languages := input.Languages
	if languages == nil {
		languages = []string{defaultLang}
	}

	now := time.Now()
	nowTimestamp := pgtype.Timestamp{Time: now, Valid: true}

	newUUID := uuid.New()
	projectUUID := pgtype.UUID{}
	if err := projectUUID.Scan(newUUID.String()); err != nil {
		return nil, fmt.Errorf("failed to generate project ID: %w", err)
	}

	var description pgtype.Text
	if input.Description != nil {
		description = pgtype.Text{String: *input.Description, Valid: true}
	}

	var defaultLangText pgtype.Text
	if defaultLang != "" {
		defaultLangText = pgtype.Text{String: defaultLang, Valid: true}
	}

	// Create project
	project, err := s.db.CreateProject(ctx, db.CreateProjectParams{
		ID:              projectUUID,
		Name:            input.Name,
		Description:     description,
		Slug:            slug,
		OwnerID:         userUUID,
		DefaultLanguage: defaultLangText,
		Languages:       languages,
		CreatedAt:       nowTimestamp,
		UpdatedAt:       nowTimestamp,
		IsDeleted:       false,
		Archived:        false,
	})

	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "23505") {
			return nil, &errors.ProjectConflictError{Reason: "Slug already exists"}
		}
		return nil, &errors.ProjectConflictError{Reason: err.Error()}
	}

	// Create team member (owner)
	memberUUID := pgtype.UUID{}
	memberNewUUID := uuid.New()
	if err := memberUUID.Scan(memberNewUUID.String()); err != nil {
		return nil, fmt.Errorf("failed to generate member ID: %w", err)
	}

	_, err = s.db.CreateTeamMember(ctx, db.CreateTeamMemberParams{
		ID:        memberUUID,
		ProjectID: project.ID,
		UserID:    userUUID,
		Role:      "owner",
		JoinedAt:  nowTimestamp,
		InvitedBy: userUUID,
		CreatedAt: nowTimestamp,
	})

	if err != nil {
		return nil, &errors.ProjectNotFoundError{}
	}

	return s.mapProject(project), nil
}

func (s *Service) ListProjects(ctx context.Context, userID string, pagination ListProjectsRequest) (*ListProjectsResponse, error) {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(userID); err != nil {
		return nil, &errors.ProjectNotFoundError{}
	}

	pageSize := pagination.PageSize
	if pageSize <= 0 {
		pageSize = 15
	}

	index := pagination.Index
	if index < 0 {
		index = 0
	}

	// Get projects owned by user
	ownerProjects, err := s.db.GetProjectsByOwnerID(ctx, userUUID)
	if err != nil {
		ownerProjects = []db.Project{}
	}

	// Get projects where user is a member
	members, err := s.db.GetTeamMembersByUserID(ctx, userUUID)
	if err != nil {
		members = []db.TeamMember{}
	}

	memberProjectIDs := make([]pgtype.UUID, len(members))
	for i, m := range members {
		memberProjectIDs[i] = m.ProjectID
	}

	var memberProjects []db.Project
	if len(memberProjectIDs) > 0 {
		memberProjects, _ = s.db.GetProjectsByIDs(ctx, memberProjectIDs)
	}

	// Combine and deduplicate
	allProjects := make(map[string]db.Project)
	for _, p := range ownerProjects {
		allProjects[uuidToString(p.ID)] = p
	}
	for _, p := range memberProjects {
		allProjects[uuidToString(p.ID)] = p
	}

	// Convert to slice
	projects := make([]db.Project, 0, len(allProjects))
	for _, p := range allProjects {
		projects = append(projects, p)
	}

	// Filter by status
	if pagination.Status == "active" {
		filtered := make([]db.Project, 0)
		for _, p := range projects {
			if !p.Archived {
				filtered = append(filtered, p)
			}
		}
		projects = filtered
	} else if pagination.Status == "archived" {
		filtered := make([]db.Project, 0)
		for _, p := range projects {
			if p.Archived {
				filtered = append(filtered, p)
			}
		}
		projects = filtered
	}

	// Search filter
	if pagination.Search != "" {
		searchLower := strings.ToLower(pagination.Search)
		filtered := make([]db.Project, 0)
		for _, p := range projects {
			if strings.Contains(strings.ToLower(p.Name), searchLower) {
				filtered = append(filtered, p)
			} else if p.Description.Valid && strings.Contains(strings.ToLower(p.Description.String), searchLower) {
				filtered = append(filtered, p)
			}
		}
		projects = filtered
	}

	// Sort
	sortOrder := pagination.Sort
	if sortOrder == "" {
		sortOrder = "newest"
	}

	if sortOrder == "oldest" {
		// Sort oldest first
		for i := 0; i < len(projects)-1; i++ {
			for j := i + 1; j < len(projects); j++ {
				if projects[i].CreatedAt.Valid && projects[j].CreatedAt.Valid {
					if projects[i].CreatedAt.Time.After(projects[j].CreatedAt.Time) {
						projects[i], projects[j] = projects[j], projects[i]
					}
				}
			}
		}
	} else {
		// Sort newest first (default)
		for i := 0; i < len(projects)-1; i++ {
			for j := i + 1; j < len(projects); j++ {
				if projects[i].CreatedAt.Valid && projects[j].CreatedAt.Valid {
					if projects[i].CreatedAt.Time.Before(projects[j].CreatedAt.Time) {
						projects[i], projects[j] = projects[j], projects[i]
					}
				}
			}
		}
	}

	// Filter by status
	if pagination.Status == "active" {
		filtered := make([]db.Project, 0)
		for _, p := range projects {
			if !p.Archived {
				filtered = append(filtered, p)
			}
		}
		projects = filtered
	} else if pagination.Status == "archived" {
		filtered := make([]db.Project, 0)
		for _, p := range projects {
			if p.Archived {
				filtered = append(filtered, p)
			}
		}
		projects = filtered
	}

	// Search filter
	if pagination.Search != "" {
		searchLower := strings.ToLower(pagination.Search)
		filtered := make([]db.Project, 0)
		for _, p := range projects {
			if strings.Contains(strings.ToLower(p.Name), searchLower) {
				filtered = append(filtered, p)
			} else if p.Description.Valid && strings.Contains(strings.ToLower(p.Description.String), searchLower) {
				filtered = append(filtered, p)
			}
		}
		projects = filtered
	}

	totalCount := len(projects)
	from := index * pageSize
	to := from + pageSize
	if to > totalCount {
		to = totalCount
	}
	if from > totalCount {
		from = totalCount
	}

	items := make([]Project, 0)
	if from < totalCount {
		for i := from; i < to; i++ {
			proj := s.mapProject(projects[i])
			items = append(items, *proj)
		}
	}

	hasNext := to < totalCount
	totalPageCount := 0
	if pageSize > 0 {
		totalPageCount = (totalCount + pageSize - 1) / pageSize
	}

	return &ListProjectsResponse{
		Items: items,
		Meta: ListProjectsMeta{
			Index:        index,
			PageSize:     pageSize,
			HasNext:      hasNext,
			TotalCount:   totalCount,
			TotalPageCount: totalPageCount,
		},
	}, nil
}

func (s *Service) UpdateProject(ctx context.Context, userID, projectID string, input UpdateProjectRequest) (*Project, error) {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(userID); err != nil {
		return nil, &errors.ProjectNotFoundError{}
	}

	projectUUID := pgtype.UUID{}
	if err := projectUUID.Scan(projectID); err != nil {
		return nil, &errors.ProjectNotFoundError{}
	}

	// Verify ownership
	project, err := s.db.GetProjectByID(ctx, projectUUID)
	if err != nil {
		return nil, &errors.ProjectNotFoundError{}
	}

	if uuidToString(project.OwnerID) != userID {
		return nil, &errors.ForbiddenProjectAccessError{}
	}

	if project.Archived {
		return nil, &errors.ProjectArchivedError{}
	}

	now := time.Now()
	nowTimestamp := pgtype.Timestamp{Time: now, Valid: true}

	var name pgtype.Text
	if input.Name != nil {
		name = pgtype.Text{String: *input.Name, Valid: true}
	}

	var description pgtype.Text
	if input.Description != nil {
		description = pgtype.Text{String: *input.Description, Valid: true}
	}

	var defaultLang pgtype.Text
	if input.DefaultLanguage != nil {
		defaultLang = pgtype.Text{String: *input.DefaultLanguage, Valid: true}
	}

	var languages []string
	if input.Languages != nil {
		languages = input.Languages
	}

	var slug pgtype.Text
	if input.Slug != nil {
		normalized := normalizeSlug(*input.Slug, "")
		if err := validateSlug(normalized); err != nil {
			return nil, err
		}
		slug = pgtype.Text{String: normalized, Valid: true}
	}

	updatedProject, err := s.db.UpdateProject(ctx, db.UpdateProjectParams{
		ID:              projectUUID,
		UpdatedAt:       nowTimestamp,
		Name:            name,
		Description:     description,
		DefaultLanguage: defaultLang,
		Languages:       languages,
		Slug:            slug,
	})

	if err != nil {
		return nil, &errors.ProjectNotFoundError{}
	}

	return s.mapProject(updatedProject), nil
}

func (s *Service) AddMember(ctx context.Context, userID, projectID string, input AddMemberRequest) error {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(userID); err != nil {
		return &errors.ProjectNotFoundError{}
	}

	projectUUID := pgtype.UUID{}
	if err := projectUUID.Scan(projectID); err != nil {
		return &errors.ProjectNotFoundError{}
	}

	// Verify ownership
	project, err := s.db.GetProjectByID(ctx, projectUUID)
	if err != nil {
		return &errors.ProjectNotFoundError{}
	}

	if uuidToString(project.OwnerID) != userID {
		return &errors.ForbiddenProjectAccessError{}
	}

	if project.Archived {
		return &errors.ProjectArchivedError{}
	}

	memberUserUUID := pgtype.UUID{}
	if err := memberUserUUID.Scan(input.UserID); err != nil {
		return &errors.ProjectNotFoundError{}
	}

	now := time.Now()
	nowTimestamp := pgtype.Timestamp{Time: now, Valid: true}

	memberUUID := pgtype.UUID{}
	memberNewUUID := uuid.New()
	if err := memberUUID.Scan(memberNewUUID.String()); err != nil {
		return fmt.Errorf("failed to generate member ID: %w", err)
	}

	_, err = s.db.CreateTeamMember(ctx, db.CreateTeamMemberParams{
		ID:        memberUUID,
		ProjectID: projectUUID,
		UserID:    memberUserUUID,
		Role:      input.Role,
		JoinedAt:  nowTimestamp,
		InvitedBy: userUUID,
		CreatedAt: nowTimestamp,
	})

	if err != nil {
		return &errors.ProjectNotFoundError{}
	}

	return nil
}

func (s *Service) RemoveMember(ctx context.Context, userID, projectID, memberID string) error {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(userID); err != nil {
		return &errors.ProjectNotFoundError{}
	}

	projectUUID := pgtype.UUID{}
	if err := projectUUID.Scan(projectID); err != nil {
		return &errors.ProjectNotFoundError{}
	}

	// Verify ownership
	project, err := s.db.GetProjectByID(ctx, projectUUID)
	if err != nil {
		return &errors.ProjectNotFoundError{}
	}

	if uuidToString(project.OwnerID) != userID {
		return &errors.ForbiddenProjectAccessError{}
	}

	if project.Archived {
		return &errors.ProjectArchivedError{}
	}

	memberUserUUID := pgtype.UUID{}
	if err := memberUserUUID.Scan(memberID); err != nil {
		return &errors.ProjectNotFoundError{}
	}

	err = s.db.DeleteTeamMember(ctx, db.DeleteTeamMemberParams{
		ProjectID: projectUUID,
		UserID:    memberUserUUID,
	})

	if err != nil {
		return &errors.ProjectNotFoundError{}
	}

	return nil
}

func (s *Service) mapProject(p db.Project) *Project {
	project := &Project{
		ID:        uuidToString(p.ID),
		Name:      p.Name,
		Slug:      p.Slug,
		OwnerID:   uuidToString(p.OwnerID),
		Languages: p.Languages,
		Archived:  p.Archived,
	}

	if p.Description.Valid {
		project.Description = &p.Description.String
	}

	if p.DefaultLanguage.Valid {
		project.DefaultLanguage = &p.DefaultLanguage.String
	}

	if p.CreatedAt.Valid {
		ts := p.CreatedAt.Time.Format(time.RFC3339)
		project.CreatedAt = &ts
	}

	if p.UpdatedAt.Valid {
		ts := p.UpdatedAt.Time.Format(time.RFC3339)
		project.UpdatedAt = &ts
	}

	return project
}

func normalizeSlug(slug, name string) string {
	raw := slug
	if raw == "" {
		raw = name
	}
	trimmed := strings.TrimSpace(strings.ToLower(raw))
	trimmed = regexp.MustCompile(`\s+`).ReplaceAllString(trimmed, "-")
	trimmed = regexp.MustCompile(`[^a-z0-9-]`).ReplaceAllString(trimmed, "-")
	trimmed = regexp.MustCompile(`-{2,}`).ReplaceAllString(trimmed, "-")
	trimmed = strings.Trim(trimmed, "-")
	return trimmed
}

func validateSlug(slug string) error {
	matched, err := regexp.MatchString(SLUG_REGEX, slug)
	if err != nil || !matched || len(slug) == 0 {
		return &errors.ProjectValidationError{Reason: "Slug must match ^[a-z0-9-]+$"}
	}
	return nil
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	var id [16]byte
	copy(id[:], u.Bytes[:])
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%12x", id[0:4], id[4:6], id[6:8], id[8:10], id[10:16])
}


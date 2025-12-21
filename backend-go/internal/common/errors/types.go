package errors

import "fmt"

// Error types matching NestJS error names
type ErrorName string

const (
	ErrorNameMissingAuthHeader    ErrorName = "MissingAuthHeaderError"
	ErrorNameInvalidAuthScheme    ErrorName = "InvalidAuthSchemeError"
	ErrorNameInvalidToken         ErrorName = "InvalidTokenError"
	ErrorNameProviderAuth         ErrorName = "ProviderAuthError"
	ErrorNameUnauthorized         ErrorName = "UnauthorizedError"
	ErrorNameProjectNotFound      ErrorName = "ProjectNotFoundError"
	ErrorNameProjectConflict      ErrorName = "ProjectConflictError"
	ErrorNameForbiddenProjectAccess ErrorName = "ForbiddenProjectAccessError"
	ErrorNameProjectValidation    ErrorName = "ProjectValidationError"
	ErrorNameProjectArchived      ErrorName = "ProjectArchivedError"
	ErrorNameUserNotFound         ErrorName = "UserNotFoundError"
	ErrorNameUserConflict         ErrorName = "UserConflictError"
	ErrorNamePersonalTeamNotFound ErrorName = "PersonalTeamNotFoundError"
	ErrorNameTeamAccessForbidden  ErrorName = "TeamAccessForbiddenError"
	ErrorNameInvalidTeam          ErrorName = "InvalidTeamError"
	ErrorNameMissingEnv           ErrorName = "MissingEnvError"
	ErrorNameInvalidPort          ErrorName = "InvalidPortError"
)

// Custom error types
type UnauthorizedError struct {
	Reason string
}

func (e *UnauthorizedError) Error() string {
	if e.Reason != "" {
		return "Unauthorized: " + e.Reason
	}
	return "Unauthorized"
}

type InvalidTokenError struct {
	Reason string
}

func (e *InvalidTokenError) Error() string {
	if e.Reason != "" {
		return "Invalid token: " + e.Reason
	}
	return "Invalid token"
}

type ProviderAuthError struct {
	Message string
}

func (e *ProviderAuthError) Error() string {
	return e.Message
}

type InvalidTeamError struct {
	TeamID string
}

func (e *InvalidTeamError) Error() string {
	return "Invalid team ID: " + e.TeamID
}

type TeamAccessForbiddenError struct {
	UserID string
	TeamID string
}

func (e *TeamAccessForbiddenError) Error() string {
	return "User is not a member of team " + e.TeamID
}

type ProjectNotFoundError struct{}

func (e *ProjectNotFoundError) Error() string {
	return "Project not found"
}

type ProjectConflictError struct {
	Reason string
}

func (e *ProjectConflictError) Error() string {
	if e.Reason != "" {
		return "Project conflict: " + e.Reason
	}
	return "Project conflict"
}

type ProjectValidationError struct {
	Reason string
}

func (e *ProjectValidationError) Error() string {
	if e.Reason != "" {
		return "Project validation failed: " + e.Reason
	}
	return "Project validation failed"
}

type ForbiddenProjectAccessError struct {
	Plan         string
	CurrentCount int
	Limit        int
}

func (e *ForbiddenProjectAccessError) Error() string {
	if e.Plan != "" && e.Limit > 0 {
		projects := "project"
		if e.Limit != 1 {
			projects = "projects"
		}
		// Match NestJS format: "Your {plan} plan allows {limit} {project(s)}, and you currently have {count}."
		return fmt.Sprintf("Project limit exceeded. Your %s plan allows %d %s, and you currently have %d.", e.Plan, e.Limit, projects, e.CurrentCount)
	}
	return "Forbidden: insufficient project access"
}

type ProjectArchivedError struct{}

func (e *ProjectArchivedError) Error() string {
	return "Project is archived. Only read operations are allowed."
}

type UserNotFoundError struct{}

func (e *UserNotFoundError) Error() string {
	return "User not found"
}

type UserConflictError struct {
	Reason string
}

func (e *UserConflictError) Error() string {
	if e.Reason != "" {
		return "User conflict: " + e.Reason
	}
	return "User conflict"
}

type PersonalTeamNotFoundError struct {
	UserID string
}

func (e *PersonalTeamNotFoundError) Error() string {
	if e.UserID != "" {
		return "Personal team not found for user: " + e.UserID
	}
	return "Personal team not found"
}


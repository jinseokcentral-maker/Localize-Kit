package errors

import (
	"fmt"
	"net/http"
	"strings"
)

type HTTPError struct {
	StatusCode int
	Message    string
}

func (e *HTTPError) Error() string {
	return e.Message
}

// Map maps application errors to HTTP errors
func Map(err error) *HTTPError {
	if err == nil {
		return nil
	}

	// Check for specific error types
	switch e := err.(type) {
	case *ProviderAuthError:
		// ProviderAuthError → 500
		return &HTTPError{
			StatusCode: http.StatusInternalServerError,
			Message:    fmt.Sprintf("Provider authentication failed: %s", e.Message),
		}

	case *UnauthorizedError:
		// UnauthorizedError → 401
		msg := "Invalid token"
		if e.Reason != "" {
			msg = fmt.Sprintf("Invalid token: %s", e.Reason)
		}
		return &HTTPError{
			StatusCode: http.StatusUnauthorized,
			Message:    msg,
		}

	case *InvalidTokenError:
		// InvalidTokenError → 401
		msg := "Invalid token"
		if e.Reason != "" {
			msg = fmt.Sprintf("Invalid token: %s", e.Reason)
		}
		return &HTTPError{
			StatusCode: http.StatusUnauthorized,
			Message:    msg,
		}

	case *InvalidTeamError:
		// InvalidTeamError → 400
		return &HTTPError{
			StatusCode: http.StatusBadRequest,
			Message:    fmt.Sprintf("Invalid team ID: %s", e.TeamID),
		}

	case *TeamAccessForbiddenError:
		// TeamAccessForbiddenError → 403
		return &HTTPError{
			StatusCode: http.StatusForbidden,
			Message:    fmt.Sprintf("User is not a member of team %s", e.TeamID),
		}

	case *ForbiddenProjectAccessError:
		// ForbiddenProjectAccessError → 403
		msg := e.Error()
		return &HTTPError{
			StatusCode: http.StatusForbidden,
			Message:    msg,
		}

	case *ProjectArchivedError:
		// ProjectArchivedError → 403
		return &HTTPError{
			StatusCode: http.StatusForbidden,
			Message:    "Project is archived. Only read operations are allowed.",
		}

	case *ProjectConflictError:
		// ProjectConflictError → 409
		msg := "Project conflict"
		if e.Reason != "" {
			msg = fmt.Sprintf("Project conflict: %s", e.Reason)
		}
		return &HTTPError{
			StatusCode: http.StatusConflict,
			Message:    msg,
		}

	case *ProjectValidationError:
		// ProjectValidationError → 400
		msg := "Project validation failed"
		if e.Reason != "" {
			msg = fmt.Sprintf("Project validation failed: %s", e.Reason)
		}
		return &HTTPError{
			StatusCode: http.StatusBadRequest,
			Message:    msg,
		}

	case *PersonalTeamNotFoundError:
		// PersonalTeamNotFoundError → 500
		msg := "Personal team not found for user"
		if e.UserID != "" {
			msg = fmt.Sprintf("Personal team not found for user: %s", e.UserID)
		}
		return &HTTPError{
			StatusCode: http.StatusInternalServerError,
			Message:    msg,
		}

	case *ProjectNotFoundError:
		// ProjectNotFoundError → 404 (assuming, will check NestJS behavior)
		return &HTTPError{
			StatusCode: http.StatusNotFound,
			Message:    "Project not found",
		}

	case *UserNotFoundError:
		// UserNotFoundError → 404
		return &HTTPError{
			StatusCode: http.StatusNotFound,
			Message:    "User not found",
		}

	case *UserConflictError:
		// UserConflictError → 409
		msg := "User conflict"
		if e.Reason != "" {
			msg = fmt.Sprintf("User conflict: %s", e.Reason)
		}
		return &HTTPError{
			StatusCode: http.StatusConflict,
			Message:    msg,
		}

	default:
		// Check for JWT expired errors
		errMsg := err.Error()
		errMsgLower := strings.ToLower(errMsg)
		if strings.Contains(errMsgLower, "jwt") && strings.Contains(errMsgLower, "expired") {
			return &HTTPError{
				StatusCode: http.StatusUnauthorized,
				Message:    "JWT token expired",
			}
		}

		// Unknown errors → 500
		return &HTTPError{
			StatusCode: http.StatusInternalServerError,
			Message:    errMsg,
		}
	}
}


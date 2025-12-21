package e2e

import (
	authErrors "backend-go/internal/common/errors"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
)

// ErrorResponse represents the error response structure
type ErrorResponse struct {
	StatusCode int    `json:"statusCode"`
	Message    string `json:"message"`
	Path       string `json:"path"`
	RequestID  string `json:"requestId,omitempty"`
	Timestamp  string `json:"timestamp"`
}

// setupTestServer creates a test Echo server with error handling
func setupTestServer() *echo.Echo {
	e := echo.New()

	// Setup error handler
	e.HTTPErrorHandler = func(err error, c echo.Context) {
		httpErr := authErrors.Map(err)
		c.JSON(httpErr.StatusCode, ErrorResponse{
			StatusCode: httpErr.StatusCode,
			Message:    httpErr.Message,
			Path:       c.Request().URL.Path,
		})
	}

	// Setup test routes for error testing
	testGroup := e.Group("/test-errors")

	testGroup.GET("/provider-auth", func(c echo.Context) error {
		return &authErrors.ProviderAuthError{Message: "Database connection failed"}
	})

	testGroup.GET("/invalid-token", func(c echo.Context) error {
		return &authErrors.InvalidTokenError{Reason: "Token expired"}
	})

	testGroup.GET("/unauthorized", func(c echo.Context) error {
		return &authErrors.UnauthorizedError{Reason: "Missing token"}
	})

	testGroup.GET("/invalid-team", func(c echo.Context) error {
		return &authErrors.InvalidTeamError{TeamID: "team-123"}
	})

	testGroup.GET("/project-forbidden", func(c echo.Context) error {
		return &authErrors.ForbiddenProjectAccessError{
			Plan:        "free",
			CurrentCount: 2,
			Limit:       1,
		}
	})

	testGroup.GET("/plain-error", func(c echo.Context) error {
		return fmt.Errorf("Something went wrong")
	})

	testGroup.GET("/plain-object", func(c echo.Context) error {
		// In Go, we can't throw plain objects like in JS
		// We'll return a generic error instead
		return fmt.Errorf("Internal server error")
	})

	testGroup.GET("/jwt-expired", func(c echo.Context) error {
		return fmt.Errorf("JWT expired")
	})

	testGroup.GET("/personal-team-missing", func(c echo.Context) error {
		return &authErrors.PersonalTeamNotFoundError{UserID: "user-99"}
	})

	// Health check
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "OK")
	})

	return e
}

func TestHealthCheck(t *testing.T) {
	e := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Equal(t, "OK", rec.Body.String())
}

func TestProviderAuthError(t *testing.T) {
	e := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/test-errors/provider-auth", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)

	var resp ErrorResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp.Message, "Provider authentication failed")
	assert.Contains(t, resp.Message, "Database connection failed")
}

func TestInvalidTokenError(t *testing.T) {
	e := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/test-errors/invalid-token", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)

	var resp ErrorResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp.Message, "Invalid token")
	assert.Contains(t, resp.Message, "Token expired")
}

func TestUnauthorizedError(t *testing.T) {
	e := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/test-errors/unauthorized", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)

	var resp ErrorResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp.Message, "Invalid token")
	assert.Contains(t, resp.Message, "Missing token")
}

func TestInvalidTeamError(t *testing.T) {
	e := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/test-errors/invalid-team", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)

	var resp ErrorResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp.Message, "Invalid team ID: team-123")
}

func TestProjectForbiddenError(t *testing.T) {
	e := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/test-errors/project-forbidden", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusForbidden, rec.Code)

	var resp ErrorResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "Project limit exceeded. Your free plan allows 1 project, and you currently have 2.", resp.Message)
}

func TestPlainError(t *testing.T) {
	e := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/test-errors/plain-error", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)

	var resp ErrorResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "Something went wrong", resp.Message)
}

func TestPlainObjectError(t *testing.T) {
	e := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/test-errors/plain-object", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)

	var resp ErrorResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp.Message, "Internal server error")
}

func TestJWTExpiredError(t *testing.T) {
	e := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/test-errors/jwt-expired", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)

	var resp ErrorResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	// Check that message contains jwt and expired (case insensitive)
	message := resp.Message
	assert.True(t, containsIgnoreCase(message, "jwt") && containsIgnoreCase(message, "expired"),
		"Expected message to contain 'jwt' and 'expired', got: %s", message)
}

func TestPersonalTeamMissingError(t *testing.T) {
	e := setupTestServer()

	req := httptest.NewRequest(http.MethodGet, "/test-errors/personal-team-missing", nil)
	rec := httptest.NewRecorder()

	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)

	var resp ErrorResponse
	err := json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp.Message, "Personal team not found for user")
	assert.Contains(t, resp.Message, "user-99")
}

// Helper function to check case-insensitive substring
func containsIgnoreCase(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}


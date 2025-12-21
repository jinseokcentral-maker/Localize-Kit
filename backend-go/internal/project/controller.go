package project

import (
	"backend-go/internal/auth"
	"backend-go/internal/common/response"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

type Controller struct {
	service   *Service
	validator *validator.Validate
}

func NewController(service *Service) *Controller {
	return &Controller{
		service:   service,
		validator: validator.New(),
	}
}

// CreateProject godoc
// @Summary Create project
// @Description Create project
// @Tags projects
// @Accept json
// @Produce json
// @Security jwt
// @Param body body CreateProjectRequest true "Project creation payload"
// @Success 201 {object} ProjectResponse "Created project"
// @Failure 400 {object} response.ErrorResponse "Invalid payload"
// @Failure 401 {object} response.ErrorResponse "Unauthorized"
// @Failure 403 {object} response.ErrorResponse "Project limit exceeded"
// @Failure 409 {object} response.ErrorResponse "Project conflict"
// @Router /projects [post]
func (c *Controller) CreateProject(ctx echo.Context) error {
	user, err := auth.GetUserFromContext(ctx)
	if err != nil {
		return err
	}

	var req CreateProjectRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.validator.Struct(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	planName := "free"
	if user.Plan != nil {
		planName = *user.Plan
	}

	project, err := c.service.CreateProject(ctx.Request().Context(), user.Sub, req, planName)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build(project))
}

// ListProjects godoc
// @Summary List my projects
// @Description List my projects
// @Tags projects
// @Accept json
// @Produce json
// @Security jwt
// @Param pageSize query int false "Page size" default(15)
// @Param index query int false "Page index" default(0)
// @Param search query string false "Search query"
// @Param status query string false "Filter by status (active, archived)"
// @Param sort query string false "Sort order (newest, oldest)" default(newest)
// @Success 200 {object} ListProjectsResponseWrapper "Project list"
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /projects [get]
func (c *Controller) ListProjects(ctx echo.Context) error {
	user, err := auth.GetUserFromContext(ctx)
	if err != nil {
		return err
	}

	var pagination ListProjectsRequest
	if err := ctx.Bind(&pagination); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid query parameters")
	}

	// Set defaults
	if pagination.PageSize <= 0 {
		pagination.PageSize = 15
	}
	if pagination.Index < 0 {
		pagination.Index = 0
	}
	if pagination.Sort == "" {
		pagination.Sort = "newest"
	}

	if err := c.validator.Struct(&pagination); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := c.service.ListProjects(ctx.Request().Context(), user.Sub, pagination)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build(result))
}

// UpdateProject godoc
// @Summary Update project
// @Description Update project
// @Tags projects
// @Accept json
// @Produce json
// @Security jwt
// @Param id path string true "Project ID"
// @Param body body UpdateProjectRequest true "Project update payload"
// @Success 200 {object} ProjectResponse "Updated project"
// @Failure 400 {object} response.ErrorResponse "Invalid payload"
// @Failure 401 {object} response.ErrorResponse "Unauthorized"
// @Failure 403 {object} response.ErrorResponse "Forbidden"
// @Failure 404 {object} response.ErrorResponse "Project not found"
// @Failure 409 {object} response.ErrorResponse "Project conflict"
// @Router /projects/{id} [put]
func (c *Controller) UpdateProject(ctx echo.Context) error {
	user, err := auth.GetUserFromContext(ctx)
	if err != nil {
		return err
	}

	projectID := ctx.Param("id")
	if projectID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Project ID is required")
	}

	var req UpdateProjectRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.validator.Struct(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	project, err := c.service.UpdateProject(ctx.Request().Context(), user.Sub, projectID, req)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build(project))
}

// AddMember godoc
// @Summary Add project member (owner only)
// @Description Add project member (owner only)
// @Tags projects
// @Accept json
// @Produce json
// @Security jwt
// @Param id path string true "Project ID"
// @Param body body AddMemberRequest true "Add member payload"
// @Success 200 {object} map[string]interface{} "Member added"
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Router /projects/{id}/members [post]
func (c *Controller) AddMember(ctx echo.Context) error {
	user, err := auth.GetUserFromContext(ctx)
	if err != nil {
		return err
	}

	projectID := ctx.Param("id")
	if projectID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Project ID is required")
	}

	var req AddMemberRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.validator.Struct(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.service.AddMember(ctx.Request().Context(), user.Sub, projectID, req); err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build[interface{}](nil))
}

// RemoveMember godoc
// @Summary Remove project member (owner only)
// @Description Remove project member (owner only)
// @Tags projects
// @Accept json
// @Produce json
// @Security jwt
// @Param id path string true "Project ID"
// @Param body body RemoveMemberRequest true "Remove member payload"
// @Success 200 {object} map[string]interface{} "Member removed"
// @Failure 400 {object} response.ErrorResponse "Invalid payload"
// @Failure 401 {object} response.ErrorResponse "Unauthorized"
// @Failure 403 {object} response.ErrorResponse "Forbidden"
// @Failure 404 {object} response.ErrorResponse "Project not found"
// @Router /projects/{id}/members/remove [post]
func (c *Controller) RemoveMember(ctx echo.Context) error {
	user, err := auth.GetUserFromContext(ctx)
	if err != nil {
		return err
	}

	projectID := ctx.Param("id")
	if projectID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Project ID is required")
	}

	var req RemoveMemberRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.validator.Struct(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := c.service.RemoveMember(ctx.Request().Context(), user.Sub, projectID, req.UserID); err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build[interface{}](nil))
}


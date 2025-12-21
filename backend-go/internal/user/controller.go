package user

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

// Register godoc
// @Summary Register a new user
// @Description Register a new user
// @Tags users
// @Accept json
// @Produce json
// @Param body body RegisterUserRequest true "User registration payload"
// @Success 200 {object} RegisterUserResponseWrapper "Created user and JWT token"
// @Failure 400 {object} response.ErrorResponse
// @Failure 409 {object} response.ErrorResponse
// @Router /users/register [post]
func (c *Controller) Register(ctx echo.Context) error {
	var req RegisterUserRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.validator.Struct(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	user, err := c.service.RegisterUser(ctx.Request().Context(), req)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build(user))
}

// GetMe godoc
// @Summary Get current user profile
// @Description Get current user profile
// @Tags users
// @Accept json
// @Produce json
// @Security jwt
// @Success 200 {object} UserResponse "Current user"
// @Failure 401 {object} response.ErrorResponse "Unauthorized"
// @Router /users/me [get]
func (c *Controller) GetMe(ctx echo.Context) error {
	user, err := auth.GetUserFromContext(ctx)
	if err != nil {
		return err
	}

	var activeTeamID *string
	if user.TeamID != nil {
		activeTeamID = user.TeamID
	}

	userData, err := c.service.GetUserById(ctx.Request().Context(), user.Sub, activeTeamID)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build(userData))
}

// UpdateMe godoc
// @Summary Update current user profile
// @Description Update current user profile
// @Tags users
// @Accept json
// @Produce json
// @Security jwt
// @Param body body UpdateUserRequest true "User update payload"
// @Success 200 {object} UserResponse "Updated user"
// @Failure 400 {object} response.ErrorResponse "Invalid request"
// @Failure 401 {object} response.ErrorResponse "Unauthorized"
// @Router /users/me [put]
func (c *Controller) UpdateMe(ctx echo.Context) error {
	user, err := auth.GetUserFromContext(ctx)
	if err != nil {
		return err
	}

	var req UpdateUserRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.validator.Struct(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	userData, err := c.service.UpdateUser(ctx.Request().Context(), user.Sub, req)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build(userData))
}


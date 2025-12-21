package team

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

// CreateTeam godoc
// @Summary Create a team (org workspace)
// @Description Create a team (org workspace)
// @Tags teams
// @Accept json
// @Produce json
// @Security jwt
// @Param body body CreateTeamRequest true "Team creation payload"
// @Success 201 {object} TeamResponse "Team created"
// @Failure 400 {object} response.ErrorResponse "Invalid payload"
// @Failure 401 {object} response.ErrorResponse "Unauthorized"
// @Router /teams [post]
func (c *Controller) CreateTeam(ctx echo.Context) error {
	user, err := auth.GetUserFromContext(ctx)
	if err != nil {
		return err
	}

	var req CreateTeamRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.validator.Struct(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	team, err := c.service.CreateTeam(ctx.Request().Context(), user.Sub, req)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build(team))
}


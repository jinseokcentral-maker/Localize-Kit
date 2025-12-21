package auth

import (
	"backend-go/internal/common/response"
	"backend-go/internal/config"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

type Controller struct {
	service   *Service
	config    *config.Config
	validator *validator.Validate
}

func NewController(service *Service, cfg *config.Config, validator *validator.Validate) *Controller {
	return &Controller{
		service:   service,
		config:    cfg,
		validator: validator,
	}
}

// Login godoc
// @Summary Login with Google access token
// @Description Login with Google access token
// @Tags auth
// @Accept json
// @Produce json
// @Param body body ProviderLoginRequest true "Provider access token payload"
// @Success 200 {object} TokenPairResponse "Issued token pair"
// @Failure 400 {object} response.ErrorResponse
// @Router /auth/login [post]
func (c *Controller) Login(ctx echo.Context) error {
	var req ProviderLoginRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.validator.Struct(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	tokens, err := c.service.LoginWithGoogleAccessToken(ctx.Request().Context(), req.AccessToken, req.TeamID)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build(tokens))
}

// Refresh godoc
// @Summary Refresh access/refresh tokens
// @Description Refresh access/refresh tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param body body RefreshTokensRequest true "Refresh token payload"
// @Success 200 {object} TokenPairResponse "New token pair"
// @Failure 400 {object} response.ErrorResponse
// @Router /auth/refresh [post]
func (c *Controller) Refresh(ctx echo.Context) error {
	var req RefreshTokensRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.validator.Struct(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	tokens, err := c.service.RefreshTokens(ctx.Request().Context(), req.RefreshToken)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build(tokens))
}

// SwitchTeam godoc
// @Summary Switch active team and get new tokens
// @Description Switch active team and get new tokens
// @Tags auth
// @Accept json
// @Produce json
// @Security jwt
// @Param body body SwitchTeamRequest true "Switch team payload"
// @Success 200 {object} TokenPairResponse "New token pair with teamId"
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse "Unauthorized"
// @Router /auth/switch-team [post]
func (c *Controller) SwitchTeam(ctx echo.Context) error {
	user, err := GetUserFromContext(ctx)
	if err != nil {
		return err
	}

	var req SwitchTeamRequest
	if err := ctx.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.validator.Struct(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	userID := pgtype.UUID{}
	if err := userID.Scan(user.Sub); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID")
	}

	tokens, err := c.service.SwitchTeam(ctx.Request().Context(), userID, req.TeamID)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response.Build(tokens))
}


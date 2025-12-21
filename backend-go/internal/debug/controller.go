package debug

import (
	"backend-go/internal/auth"
	"backend-go/internal/common/errors"
	"backend-go/internal/common/response"
	"backend-go/internal/config"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
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

func (ctrl *Controller) RegisterRoutes(g *echo.Group) {
	g.POST("/debug/users/plan", ctrl.UpdateUserPlan, auth.Public())
}

// UpdateUserPlan godoc
// @Summary Debug: update user personal plan (free|pro)
// @Description Debug: update user personal plan (free|pro)
// @Tags debug
// @Accept json
// @Produce json
// @Param body body UpdateUserPlanRequest true "Update plan payload (debug only)"
// @Success 200 {object} UpdateUserPlanResponseWrapper "Plan updated"
// @Failure 400 {object} response.ErrorResponse "Invalid request"
// @Failure 403 {object} response.ErrorResponse "Not allowed in production"
// @Router /debug/users/plan [post]
func (ctrl *Controller) UpdateUserPlan(c echo.Context) error {
	// Ensure non-production
	if ctrl.config.NodeEnv == "production" {
		return c.JSON(http.StatusForbidden, map[string]string{
			"message": "Not allowed in production",
		})
	}

	var req UpdateUserPlanRequest
	if err := c.Bind(&req); err != nil {
		log.Error().Err(err).Msg("UpdateUserPlan: failed to bind request")
		return errors.Map(err)
	}
	if err := ctrl.validator.Struct(req); err != nil {
		log.Error().Err(err).Msg("UpdateUserPlan: validation failed")
		return errors.Map(err)
	}

	// Resolve target user ID
	var targetUserID string
	if req.UserID != nil && *req.UserID != "" {
		targetUserID = *req.UserID
	} else {
		// Try to get from JWT claims if available
		user := c.Get("user")
		if user == nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"message": "Missing userId or auth",
			})
		}
		// Extract user ID from JWT payload
		if jwtPayload, ok := user.(auth.JwtPayload); ok {
			targetUserID = jwtPayload.Sub
		}
		if targetUserID == "" {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"message": "Missing userId or auth",
			})
		}
	}

	err := ctrl.service.UpdateUserPlan(c.Request().Context(), targetUserID, req.Plan)
	if err != nil {
		log.Error().Err(err).Msg("UpdateUserPlan: service failed")
		return errors.Map(err)
	}

	return c.JSON(http.StatusOK, response.Build(map[string]bool{"success": true}))
}


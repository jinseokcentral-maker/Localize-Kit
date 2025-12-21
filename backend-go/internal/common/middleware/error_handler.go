package middleware

import (
	"backend-go/internal/common/errors"
	"backend-go/internal/common/response"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
)

// CustomHTTPErrorHandler handles all errors in the Echo application.
func ErrorHandler(err error, c echo.Context) {
	var (
		code = http.StatusInternalServerError
		msg  interface{}
	)

	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		msg = he.Message
		if he.Internal != nil {
			err = he.Internal
		}
	} else {
		// Map custom application errors to HTTP errors
		httpError := errors.Map(err)
		code = httpError.StatusCode
		msg = httpError.Message
	}

	// Log the error
	log.Error().Err(err).
		Int("status", code).
		Str("path", c.Request().URL.Path).
		Str("method", c.Request().Method).
		Interface("message", msg).
		Msg("request_exception")

	// Send response
	if !c.Response().Committed {
		envelope := response.Build(msg)
		c.JSON(code, envelope)
	}
}


package logging

import (
	"os"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog"
)

func LoggerMiddleware(logger zerolog.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()

			err := next(c)

			req := c.Request()
			res := c.Response()

			event := logger.Info()
			if err != nil {
				event = logger.Error().Err(err)
			}

			event.
				Str("requestId", res.Header().Get(echo.HeaderXRequestID)).
				Str("path", req.URL.Path).
				Str("method", req.Method).
				Int("statusCode", res.Status).
				Dur("latency", time.Since(start)).
				Msg("request_completed")

			return err
		}
	}
}

func NewLogger(level string) zerolog.Logger {
	var logLevel zerolog.Level
	switch level {
	case "debug":
		logLevel = zerolog.DebugLevel
	case "info":
		logLevel = zerolog.InfoLevel
	case "warn":
		logLevel = zerolog.WarnLevel
	case "error":
		logLevel = zerolog.ErrorLevel
	default:
		logLevel = zerolog.InfoLevel
	}

	return zerolog.New(zerolog.ConsoleWriter{Out: os.Stdout, NoColor: false}).
		Level(logLevel).
		With().
		Timestamp().
		Logger()
}


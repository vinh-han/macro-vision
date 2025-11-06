package middleware

import (
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog"
)

func SetupLogger(e *echo.Echo) {
	logger := zerolog.New(zerolog.ConsoleWriter{Out: os.Stdout})
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogError:    true,
		LogURI:      true,
		LogStatus:   true,
		HandleError: true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			if v.Error == nil {
				logger.Info().
					Timestamp().
					Str("URI", v.URI).
					Int("status", v.Status).
					Msg("request")
			} else {
				logger.Error().
					Timestamp().
					Err(v.Error).
					Str("URI", v.URI).
					Int("status", v.Status).
					Msg("err:")
			}
			return nil
		},
	}))
}

package middleware

import (
	"errors"
	"macro_vision/custom_errors"
	"macro_vision/database"
	"net/http"

	"github.com/labstack/echo/v4/middleware"

	"github.com/labstack/echo/v4"
)

func session_validator(token string, c echo.Context) (bool, error) {
	user, err := database.GetUser(c.Request().Context(), token)

	switch {
    case errors.Is(err, custom_errors.SessionNotFound):
		return false, echo.NewHTTPError(http.StatusUnauthorized, "invalid token")

	case err != nil:
		return false, echo.NewHTTPError(http.StatusInternalServerError, err)

	default:
		c.Set("user", user)
		return true, nil
	}
}

var Auth_config middleware.KeyAuthConfig = middleware.KeyAuthConfig{
	KeyLookup:  "header:" + echo.HeaderAuthorization,
	AuthScheme: "Bearer",
	Validator:  session_validator,
}

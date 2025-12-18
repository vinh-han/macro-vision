package middleware

import (
	"database/sql"
	"macro_vision/database"
	"net/http"

	"github.com/labstack/echo/v4/middleware"

	"github.com/labstack/echo/v4"
)

func session_validator(token string, c echo.Context) (bool, error) {
	user, err := database.GetUser(c.Request().Context(), token)

	switch {
	case err == sql.ErrNoRows:
		// Invalid token.
		return false, nil

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

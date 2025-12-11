package handlers

import (
	"strings"

	"github.com/labstack/echo/v4"
)

func get_auth_token(c echo.Context) (token string) {
	auth := c.Request().Header.Get("Authorization")
	if auth == "" {
		return ""
	}

	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}

	return parts[1]
}

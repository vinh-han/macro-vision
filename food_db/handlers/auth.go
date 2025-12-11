package handlers

import (
	config "macro_vision/config"
	custom_errors "macro_vision/custom_errors"
	auth_service "macro_vision/services/auth"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

// TODO: some refactoring might be needed
func AuthRouter(e *echo.Group) error {
	group := e.Group(config.Auth.AuthGroup)
	group.POST(config.Auth.LoginPath, login)
	group.GET(config.Auth.RegisterPath, signup)
	group.GET(config.Auth.LogoutPath, logout)
	return nil
}

// Gives the user a token to authenticate
//
//	@Summary		login
//	@Description	Verify user’s login credentials (username and password), then generate a session and return the session token back to user
//	@Tags			/auth
//	@Accept			json
//	@Produce		json
//	@Param			Request	body	auth_service.LoginParam	true	"login parameters"
//	@Router			/auth/login [post]
//	@Success		200	{object}	auth_service.LoginResponse	"Ok"
//	@Failure		404	{string}	string						"User not found in db"
//	@Failure		409	{string}	string						"Invalid Credentials"
//	@Failure		500	{string}	string						"Server Error"
func login(c echo.Context) (err error) {
	login_info := new(auth_service.LoginParam)
	if err = c.Bind(login_info); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	token, err := auth_service.Login(c.Request().Context(), *login_info)
	if err == custom_errors.DbNotInit || err == custom_errors.TokenGenFailed {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	if err == custom_errors.UserNotFound {
		return echo.NewHTTPError(http.StatusNotFound, err)
	}
	if err == custom_errors.InvalidCredentials {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, token)
}

// Make an account for the user to login
//
//	@Summary		signup
//	@Description	Receive the sign up information, validate username (check if it exists), password (has to be lower than 71 byte for bcrypt hashing), and email (correct format). Then generate the session and return the token to the user (auto login)
//	@Tags			/auth
//	@Accept			json
//	@Produce		json
//	@Param			Request	body	auth_service.SignupParam	true	"signup parameters"
//	@Router			/auth/signup [post]
//	@Success		201	{object}	auth_service.SignupResponse	"Account Created"
//	@Failure		409	{string}	string						"Password too long (over 71 bytes)"
//	@Failure		500	{string}	string						"Server Error"
func signup(c echo.Context) (err error) {
	singup_info := new(auth_service.SignupParam)
	if err = c.Bind(singup_info); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	token, err := auth_service.Signup(c.Request().Context(), *singup_info)
	if err == custom_errors.DbNotInit || err == custom_errors.TokenGenFailed {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	if err == custom_errors.PasswordTooLong {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, token)
}

// Removes the user auth token and log them out
//
//	@Summary					logout
//	@Description				Verify the received token and perform session clean up.
//	@Tags						/auth
//	@Accept						json
//	@Produce					json
//	@securityDefinitions.apikey	ApiKeyAuth
//	@Param						Token	header	string	true	"256bit random token"	example(f3d9c4e6a7b1ce204fa8d5b39e181f9b3e2c1d7fbe4490d6732eab5c4fd7c92e)
//	@Router						/auth/logout [get]
//	@Success					204
func logout(c echo.Context) (err error) {
	auth := c.Request().Header.Get("Authorization")
	if auth == "" {
		return c.NoContent(http.StatusNoContent)
	}

	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid auth header format")
	}

	token := parts[1]
	err = auth_service.Logout(c.Request().Context(), token)
	// ignoring errors
	return c.NoContent(http.StatusNoContent)
}

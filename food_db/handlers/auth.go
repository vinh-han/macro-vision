package handlers

import (
	"errors"
	config "macro_vision/config"
	custom_errors "macro_vision/custom_errors"
	auth_service "macro_vision/services/auth"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func AuthRouter(e *echo.Group) error {
	group := e.Group(config.Auth.AuthGroup,
		middleware.RemoveTrailingSlash(),
	)
	group.POST(config.Auth.LoginPath, login)
	group.POST(config.Auth.RegisterPath, signup)
	group.POST(config.Auth.LogoutPath, logout)
	return nil
}

type LoginResponse struct {
	Token string `json:"token" example:"f3d1b8cd4f29e6a173c0dd9d84b3af2d2e19a74ccf8b0e57a3c4d90e8f12b7ac"`
}

// Gives the user a token to authenticate
//
//	@Summary		login
//	@Description	Verify user’s login credentials (username and password), then generate a session and return the session token back to user
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			Request	body	auth_service.LoginParam	true	"login parameters"
//	@Router			/auth/login [post]
//	@Success		200	{object}	LoginResponse	"Ok"
//	@Failure		404	{string}	string			"User not found in db"
//	@Failure		409	{string}	string			"Invalid Credentials"
//	@Failure		500	{string}	string			"Server Error"
func login(c echo.Context) (err error) {
	login_info := new(auth_service.LoginParam)
	if err = c.Bind(login_info); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	token, err := auth_service.Login(c.Request().Context(), *login_info)
	if errors.Is(err, custom_errors.DbNotInit) || errors.Is(err, custom_errors.TokenGenFailed) {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	if errors.Is(err, custom_errors.UserNotFound) {
		return echo.NewHTTPError(http.StatusNotFound, err)
	}
	if errors.Is(err, custom_errors.InvalidCredentials) {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, LoginResponse{
		Token: token,
	})
}

type SignupResponse struct {
	Token string `json:"token" example:"f3d1b8cd4f29e6a173c0dd9d84b3af2d2e19a74ccf8b0e57a3c4d90e8f12b7ac"`
}

// Make an account for the user to login
//
//	@Summary		signup
//	@Description	Receive the sign up information, validate username (check if it exists), password (has to be lower than 71 byte for bcrypt hashing), and email (correct format). Then generate the session and return the token to the user (auto login)
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			Request	body	auth_service.SignupParam	true	"signup parameters"
//	@Router			/auth/signup [post]
//	@Success		201	{object}	SignupResponse	"Account Created"
//	@Failure		401	{string}	string			"Password too long (over 71 bytes)"
//	@Failure		409	{string}	string			"user alr in db"
//	@Failure		500	{string}	string			"Server Error"
func signup(c echo.Context) (err error) {
	singup_info := new(auth_service.SignupParam)
	if err = c.Bind(singup_info); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	token, err := auth_service.Signup(c.Request().Context(), *singup_info)
	if errors.Is(err, custom_errors.DbNotInit) || errors.Is(err, custom_errors.TokenGenFailed) {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	if errors.Is(err, custom_errors.PasswordTooLong) {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	if errors.Is(err, custom_errors.UserExists) {
		return echo.NewHTTPError(http.StatusConflict, err)
	}
	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, SignupResponse{
		Token: token,
	})
}

// Removes the user auth token and log them out
//
//	@Summary					logout
//	@Description				Verify the received token and perform session clean up.
//	@Tags						auth
//	@Accept						json
//	@Produce					json
//	@securityDefinitions.apikey	ApiKeyAuth
//	@Param						Authorization	header	string	true	"256bit random token"	example(f3d9c4e6a7b1ce204fa8d5b39e181f9b3e2c1d7fbe4490d6732eab5c4fd7c92e)
//	@Router						/auth/logout [get]
//	@Success					204
//	@Security					BasicAuth
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

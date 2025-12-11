package handlers

import (
	"database/sql"
	"net/http"

	user_service "macro_vision/services/users"

	"github.com/labstack/echo/v4"
)

const (
	UsersGroup       string = "/users"
	UserInfoPath     string = "/user-info"
	UserFavoritePath string = "/user-favorites"
	UserPasswordPath string = "/password"
)

func UsersRouter(e *echo.Group) error {
	group := e.Group(UsersGroup)
	group.GET(UserInfoPath, get_user)
	group.PUT(UserInfoPath, edit_user)
	group.GET(UserFavoritePath, get_favorites)
	group.PUT(UserFavoritePath, add_favorites)
	group.DELETE(UserFavoritePath, remove_favorites)
	group.PUT(UserPasswordPath, change_password)
	return nil
}

type GetUserResponse struct {
	Username    string `json:"username" example:"ranto"`
	DisplayName string `json:"display_name" example:"phantom_1234"`
	Email       string `json:"email" example:"ranto@example.com"`
}

// Get the user info
//
//	@Summary		get_info
//
//	@Description	Get the user id from the received session token, then query and return with the corresponding user’s information (except password)
//
//	@Tags			/users
//	@Accept			json
//	@Produce		json
//	@Param			Token	header	string	true	"256bit random token"	example(f3d9c4e6a7b1ce204fa8d5b39e181f9b3e2c1d7fbe4490d6732eab5c4fd7c92e)
//	@Router			/users/user-info [get]
//	@Success		200	{object}	GetUserResponse	"Ok"
//	@Failure		401	{string}	string			"no auth token found"
//	@Failure		403	{string}	string			"Invalid token"
//	@Failure		500	{string}	string			"Server Error"
func get_user(c echo.Context) (err error) {
	token := get_auth_token(c)
	if token == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "no token found")
	}
	user, err := user_service.GetUser(c.Request().Context(), token)
	if err == sql.ErrNoRows {
		return echo.NewHTTPError(http.StatusForbidden, "Invalid Token")
	}
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, GetUserResponse{
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Email:       user.Email,
	})
}

type EditUserResponse struct {
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
}

// Edits the user display name and/or email
//
//	@Summary		edit_info
//
//	@Description	Get the user id from the received session token, then query and return with the corresponding user’s information (except password)
//
//	@Tags			/users
//	@Accept			json
//	@Produce		json
//	@Param			Token	header	string						true	"256bit random token"	example(f3d9c4e6a7b1ce204fa8d5b39e181f9b3e2c1d7fbe4490d6732eab5c4fd7c92e)
//	@Param			Input	body	user_service.EditUserParam	true	"new info"
//	@Router			/users/user-info [put]
//	@Success		200	{object}	EditUserResponse	"Ok"
//	@Failure		401	{string}	string				"no auth token found"
//	@Failure		403	{string}	string				"Invalid token"
//	@Failure		409	{string}	string				"Invalid input"
//	@Failure		500	{string}	string				"Server Error"
func edit_user(c echo.Context) (err error) {
	token := get_auth_token(c)
	if token == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "no token found")
	}
	new_info := new(user_service.EditUserParam)
	if err = c.Bind(new_info); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Body")
	}
	if new_info.DisplayName == "" || new_info.Email == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Body")
	}
	display_name, email, err := user_service.EditUser(c.Request().Context(), token, new_info)
	if err == sql.ErrNoRows {
		return echo.NewHTTPError(http.StatusForbidden, "Invalid Token")
	}
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, EditUserResponse{
		DisplayName: display_name,
		Email:       email,
	})
}

func get_favorites(c echo.Context) (err error) {
	return nil
}

func add_favorites(c echo.Context) (err error) {
	return nil
}

func remove_favorites(c echo.Context) (err error) {
	return nil
}

func change_password(c echo.Context) (err error) {
	return nil
}

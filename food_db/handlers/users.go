package handlers

import (
	"errors"
	"macro_vision/custom_errors"
	"macro_vision/database"
	"net/http"

	"github.com/labstack/echo/v4/middleware"

	custom_middleware "macro_vision/middleware"
	user_service "macro_vision/services/users"

	"github.com/labstack/echo/v4"
)

const (
	UsersGroup       string = "/users"
	UserInfoPath     string = "/information"
	UserFavoritePath string = "/favorites"
	UserPasswordPath string = "/password"
)

func UsersRouter(e *echo.Group) error {
	group := e.Group(UsersGroup, middleware.RemoveTrailingSlash(), middleware.KeyAuthWithConfig(
		custom_middleware.Auth_config),
	)
	group.GET(UserInfoPath, get_user)
	group.PATCH(UserInfoPath, edit_user)
	group.GET(UserFavoritePath, get_favorites)
	group.PATCH(UserFavoritePath+"/:dish_id", add_favorites)
	group.DELETE(UserFavoritePath+"/:dish_id", remove_favorite)
	group.PATCH(UserPasswordPath, change_password)
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
//	@Tags			/users/information
//	@Accept			json
//	@Produce		json
//	@Param			Token	header	string	true	"256bit random token"	example(f3d9c4e6a7b1ce204fa8d5b39e181f9b3e2c1d7fbe4490d6732eab5c4fd7c92e)
//	@Router			/users/information [get]
//	@Success		200	{object}	GetUserResponse	"Ok"
//	@Failure		401	{string}	string			"no auth token found"
//	@Failure		403	{string}	string			"Invalid token"
//	@Failure		500	{string}	string			"Server Error"
func get_user(c echo.Context) (err error) {
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	return c.JSON(http.StatusOK, GetUserResponse{
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Email:       user.Email,
	})
}

// for show
type EditUserResponse struct {
	DisplayName string `json:"display_name" example:"phantom_1234"`
	Email       string `json:"email" example:"ranto@example.com"`
}

// Edits the user display name and/or email
//
//	@Summary		edit_info
//
//	@Description	Get the user id from the received session token, then query and return with the corresponding user’s information (except password)
//
//	@Tags			/users/information
//	@Accept			json
//	@Produce		json
//	@Param			Token	header	string						true	"256bit random token"
//	@Param			Input	body	user_service.EditUserParam	true	"new info"
//	@Router			/users/information [patch]
//	@Success		200	{object}	EditUserResponse	"Ok"
//	@Failure		401	{string}	string				"no auth token found"
//	@Failure		403	{string}	string				"Invalid token"
//	@Failure		400	{string}	string				"Invalid input"
//	@Failure		500	{string}	string				"Server Error"
func edit_user(c echo.Context) (err error) {
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	new_info := new(user_service.EditUserParam)
	if err = c.Bind(new_info); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Body")
	}
	if new_info.DisplayName == "" || new_info.Email == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Body")
	}
	response, err := user_service.EditUser(c.Request().Context(), user, new_info)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response)
}

type Favorites struct {
	DishId   string `json:"dish_id"`
	DishName string `json:"dish_name"`
}

// Returns a list of user-favorited dishes
//
//	@Summary		get_info
//
//	@Description	Get the user id from the received session token, then query and return the list of user’s favorite dishes.
//
//	@Tags			/users/favorites
//	@Accept			json
//	@Produce		json
//	@Param			Token	header	string	true	"256bit random token"
//	@Router			/users/favorites [get]
//	@Success		200	{object}	[]Favorites	"Ok"
//	@Failure		401	{string}	string		"no auth token found"
//	@Failure		403	{string}	string		"Invalid token"
//	@Failure		500	{string}	string		"Server Error"
func get_favorites(c echo.Context) (err error) {
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	favorites, err := user_service.GetFavorites(c.Request().Context(), user)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, favorites)
}

// Adds a dish to the user’s favorites
//
//	@Summary		add_favorite
//	@Description	Extract the user session from the provided token, validate the dish ID (UUIDv4),
//	@Description	then insert the dish into the user’s favorites list.
//	@Tags			/users/favorites
//	@Accept			json
//	@Produce		json
//	@Param			Token	header	string	true	"256-bit random session token"
//	@Param			dish_id	path	string	true	"UUIDv4 dish identifier"
//	@Router			/users/favorites/{dish_id} [patch]
//	@Success		201	{string}	string	"Added to favorites"
//	@Failure		400	{string}	string	"Invalid id"
//	@Failure		401	{string}	string	"no auth token found"
//	@Failure		403	{string}	string	"Invalid token"
//	@Failure		500	{string}	string	"Server Error"
func add_favorites(c echo.Context) (err error) {
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	dish_id := c.Param("dish_id")
	updated_id, err := user_service.AddFavorites(c.Request().Context(), dish_id, user)
	if errors.Is(err, custom_errors.UuidParseFailed) {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid id")
	}
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, map[string]string{
		"dish_id": updated_id,
	})
}

type RemoveFavoriteResponse struct {
	DishID string `json:"dish_id" example:"123e4567-e89b-12d3-a456-426614174000"`
}

// Removes a dish from the user’s favorites
//
//	@Summary		remove_favorite
//	@Description	Extract the user session from the provided token, validate the dish ID (UUIDv4),
//	@Description	then remove the dish from the user’s favorites list.
//	@Tags			/users/favorites
//	@Accept			json
//	@Produce		json
//	@Param			Token	header	string	true	"256-bit random session token"
//	@Param			dish_id	path	string	true	"UUIDv4 dish identifier"
//	@Router			/users/favorites/{dish_id} [delete]
//	@Success		200	{object}	RemoveFavoriteResponse	"removed dish id"
//	@Failure		400	{string}	string					"Invalid id"
//	@Failure		401	{string}	string					"no auth token found"
//	@Failure		403	{string}	string					"Invalid token"
//	@Failure		500	{string}	string					"Server Error"
func remove_favorite(c echo.Context) (err error) {
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	dish_id := c.Param("dish_id")
	updated_id, err := user_service.RemoveFavorite(c.Request().Context(), dish_id, user)
	if errors.Is(err, custom_errors.UuidParseFailed) {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid id")
	}
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, map[string]string{
		"dish_id": updated_id,
	})
}

// Changes the user's password
//
//	@Summary		change_password
//	@Description	Extracts the user session from the provided token, validates the request body,
//	@Description	then updates the user's password.
//	@Tags			/users/password
//	@Accept			json
//	@Produce		json
//	@Param			Token	header	string								true	"256-bit random session token"
//	@Param			body	body	user_service.ChangePasswordParam	true	"New password payload"
//	@Router			/users/password [patch]
//	@Success		204
//	@Failure		400	{string}	string	"Invalid Body"
//	@Failure		401	{string}	string	"No auth token found"
//	@Failure		403	{string}	string	"Invalid token"
//	@Failure		500	{string}	string	"Server Error"
func change_password(c echo.Context) (err error) {
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	param := new(user_service.ChangePasswordParam)
	if err = c.Bind(param); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid Body")
	}
	err = user_service.ChangePassword(c.Request().Context(), user, param)
	if errors.Is(err, custom_errors.InvalidInput) {
		return echo.NewHTTPError(http.StatusBadRequest, "Invlid Body")
	}
	if err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

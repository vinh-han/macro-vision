package handlers

import (
	"errors"
	"macro_vision/custom_errors"
	"macro_vision/database"
	mealcard_service "macro_vision/services/meal_cards"
	"net/http"

	custom_middleware "macro_vision/middleware"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func MealCardRouter(api *echo.Group) (err error) {
	group := api.Group("/meal-cards",
		middleware.RemoveTrailingSlash(),
		middleware.KeyAuthWithConfig(custom_middleware.Auth_config),
	)
	group.GET("/:card_id", get_meal_card)
	group.GET("/daily", get_meal_cards_daily)
	group.GET("/monthly", get_meal_cards_monthly)
	group.POST("/", create_meal_card)
	group.PUT("/:card_id", update_meal_card_info)
	group.DELETE("/:card_id", remove_meal_card)
	group.PATCH("/:card_id/dishes", add_dish_to_card)
	group.DELETE("/:card_id/dishes", remove_dish_from_card)
	return
}

// get_meal_card godoc
//
//	@Summary		Get meal card with dishes
//	@Description	Retrieve a meal card and its dishes belonging to the authenticated user.
//	@Tags			meal-cards
//	@Router			/meal-cards [get]
//	@Accept			json
//	@Produce		json
//	@Param			card_id			query		string	true	"Meal card ID (UUID)"
//	@Param			Authorization	header		string	true	"auth"
//	@Success		200				{object}	mealcard_service.MealCardDish
//	@Failure		400				{object}	echo.HTTPError	"Invalid request parameters"
//	@Failure		401				{object}	echo.HTTPError	"Unauthorized"
//	@Failure		404				{object}	echo.HTTPError	"Meal card not found"
//	@Failure		500				{object}	echo.HTTPError	"Internal server error"
//	@Security		BasicAuth
func get_meal_card(c echo.Context) (err error) {
	var request mealcard_service.GetMealCardWithDishesParam
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	if err = c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	request.UserID = user.UserID
	meal_cards, err := mealcard_service.GetMealCardWithDishes(c.Request().Context(), request)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, meal_cards)
}

// get_meal_cards_daily godoc
//
//	@Summary		Get daily meal cards
//	@Description	Retrieve all meal cards for a specific day belonging to the authenticated user.
//	@Tags			meal-cards
//	@Router			/meal-cards/daily [get]
//	@Accept			json
//	@Produce		json
//	@Param			date			query		string	true	"Meal date (YYYY-MM-DD)"
//	@Param			Authorization	header		string	true	"Meal date (YYYY-MM-DD)"
//	@Success		200				{array}		database.MealCard
//	@Failure		400				{object}	echo.HTTPError	"Invalid request parameters"
//	@Failure		401				{object}	echo.HTTPError	"Unauthorized"
//	@Failure		404				{object}	echo.HTTPError	"No meal cards found"
//	@Failure		500				{object}	echo.HTTPError	"Internal server error"
//	@Security		BasicAuth
func get_meal_cards_daily(c echo.Context) (err error) {
	var request mealcard_service.GetMealCardsDailyParam
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	if err = c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	request.UserID = user.UserID
	meal_cards, err := mealcard_service.GetMealCardsDaily(c.Request().Context(), request)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, meal_cards)
}

// get_meal_cards_monthly godoc
//
//	@Summary		Get monthly meal cards
//	@Description	Retrieve all meal cards for the month of the given date belonging to the authenticated user. The day portion of the date is ignored.
//	@Tags			meal-cards
//	@Router			/meal-cards/monthly [get]
//	@Accept			json
//	@Produce		json
//	@Param			date			query		string	true	"Reference date (YYYY-MM-DD); day is ignored"
//	@Param			Authorization	header		string	true	"Meal date (YYYY-MM-DD)"
//	@Success		200				{array}		database.MealCard
//	@Failure		400				{object}	echo.HTTPError	"Invalid request parameters"
//	@Failure		401				{object}	echo.HTTPError	"Unauthorized"
//	@Failure		404				{object}	echo.HTTPError	"No meal cards found"
//	@Failure		500				{object}	echo.HTTPError	"Internal server error"
//	@Security		BasicAuth
func get_meal_cards_monthly(c echo.Context) (err error) {
	var request mealcard_service.GetMealCardsMonthlyParam
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	if err = c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	request.UserID = user.UserID
	meal_cards, err := mealcard_service.GetMealCardsMonthly(c.Request().Context(), request)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, meal_cards)
}

// create_meal_card godoc
//
//	@Summary		Create meal card
//	@Description	Create a new meal card for the authenticated user.
//	@Tags			meal-cards
//	@Router			/meal-cards [post]
//	@Accept			json
//	@Produce		json
//	@Param			request			body		mealcard_service.CreateMealCardParam	true	"Meal card payload"
//	@Param			Authorization	header		string									true	"auth"
//	@Success		201				{object}	mealcard_service.MealCardDishID			"new card uuid"
//	@Failure		400				{object}	echo.HTTPError							"Invalid request body"
//	@Failure		401				{object}	echo.HTTPError							"Unauthorized"
//	@Failure		500				{object}	echo.HTTPError							"Internal server error"
//	@Security		BasicAuth
func create_meal_card(c echo.Context) (err error) {
	var request mealcard_service.CreateMealCardParam
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	request.UserID = user.UserID
	if err = c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	new_id, err := mealcard_service.CreateMealCard(c.Request().Context(), request)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusCreated, new_id)
}

// update_meal_card_info godoc
//
//	@Summary		Update meal card
//	@Description	Update meal card information belonging to the authenticated user.
//	@Tags			meal-cards
//	@Router			/meal-cards [put]
//	@Accept			json
//	@Produce		json
//	@Param			request			body		mealcard_service.UpdateMealCardParam	true	"Updated meal card payload"
//	@Param			Authorization	header		string									true	"auth"
//	@Success		200				{object}	mealcard_service.MealCardDish
//	@Failure		400				{object}	echo.HTTPError	"Invalid request body"
//	@Failure		401				{object}	echo.HTTPError	"Unauthorized"
//	@Failure		404				{object}	echo.HTTPError	"Meal card not found"
//	@Failure		500				{object}	echo.HTTPError	"Internal server error"
//	@Security		BasicAuth
func update_meal_card_info(c echo.Context) (err error) {
	var request mealcard_service.UpdateMealCardParam
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	if err = c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	request.UserID = user.UserID
	updated, err := mealcard_service.UpdateMealCard(c.Request().Context(), request)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, updated)
}

type RemoveMealCardResponse struct {
	RemovedId uuid.UUID `json:"removed_id"`
}

// remove_meal_card godoc
//
//	@Summary		Remove meal card
//	@Description	Remove a meal card belonging to the authenticated user.
//	@Tags			meal-cards
//	@Router			/meal-cards [delete]
//	@Accept			json
//	@Produce		json
//	@Param			card_id			query		string	true	"Meal card ID (UUID)"
//	@Param			Authorization	header		string	true	"auth"
//	@Success		200				{object}	RemoveMealCardResponse
//	@Failure		400				{object}	echo.HTTPError	"Invalid request or unauthorized operation"
//	@Failure		401				{object}	echo.HTTPError	"Unauthorized"
//	@Failure		404				{object}	echo.HTTPError	"Meal card not found"
//	@Failure		500				{object}	echo.HTTPError	"Internal server error"
//	@Security		BasicAuth
func remove_meal_card(c echo.Context) (err error) {
	var request mealcard_service.RemoveMealCardParam
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	if err = c.Bind(&request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	request.UserID = user.UserID
	removed_id, err := mealcard_service.RemoveMealCard(c.Request().Context(), request)
	if errors.Is(err, custom_errors.UnauthorizedOperation) {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, RemoveMealCardResponse{
		RemovedId: removed_id,
	})
}

type AddDishToCardResponse struct {
	AddedID uuid.UUID `json:"added_id"`
}

// add_dish_to_card godoc
//
//	@Summary		Add dish to meal card
//	@Description	Add a dish to a meal card belonging to the authenticated user.
//	@Tags			meal-cards
//	@Router			/meal-cards/dishes [post]
//	@Accept			json
//	@Produce		json
//	@Param			request			body		mealcard_service.AddDishToCardParam	true	"Add dish to meal card payload"
//	@Param			Authorization	header		string								true	"auth"
//	@Success		200				{object}	AddDishToCardResponse
//	@Failure		400				{object}	echo.HTTPError	"Invalid request or unauthorized operation"
//	@Failure		401				{object}	echo.HTTPError	"Unauthorized"
//	@Failure		404				{object}	echo.HTTPError	"Meal card or dish not found"
//	@Failure		500				{object}	echo.HTTPError	"Internal server error"
//	@Security		BasicAuth
func add_dish_to_card(c echo.Context) (err error) {
	var request mealcard_service.AddDishToCardParam
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	request.UserID = user.UserID
	added_id, err := mealcard_service.AddDishToCard(c.Request().Context(), request)
	if errors.Is(err, custom_errors.UnauthorizedOperation) {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, AddDishToCardResponse{
		AddedID: added_id,
	})
}

type RemoveDishFromCardResponse struct {
	RemovedID uuid.UUID `json:"removed_id"`
}

// remove_dish_from_card godoc
//
//	@Summary		Remove dish from meal card
//	@Description	Remove a dish from a meal card belonging to the authenticated user.
//	@Tags			meal-cards
//	@Router			/meal-cards/dishes [delete]
//	@Accept			json
//	@Produce		json
//	@Param			request			body		mealcard_service.RemoveDishFromCardParam	true	"Remove dish from meal card payload"
//	@Param			Authorization	header		string										true	"auth"
//	@Success		200				{object}	RemoveDishFromCardResponse
//	@Failure		400				{object}	echo.HTTPError	"Invalid request or unauthorized operation"
//	@Failure		401				{object}	echo.HTTPError	"Unauthorized"
//	@Failure		404				{object}	echo.HTTPError	"Meal card or dish not found"
//	@Failure		500				{object}	echo.HTTPError	"Internal server error"
//	@Security		BasicAuth
func remove_dish_from_card(c echo.Context) (err error) {
	var request mealcard_service.RemoveDishFromCardParam
	user, ok := c.Get("user").(database.User)
	if !ok {
		return echo.NewHTTPError(http.StatusInternalServerError, "user missing from context")
	}
	request.UserID = user.UserID
	removed_id, err := mealcard_service.RemoveDishFromCard(c.Request().Context(), request)
	if errors.Is(err, custom_errors.UnauthorizedOperation) {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, RemoveDishFromCardResponse{
		RemovedID: removed_id,
	})
}

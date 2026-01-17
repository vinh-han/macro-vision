package handlers

import (
	ingredients_service "macro_vision/services/ingredients"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/time/rate"
)

const (
	IngredientsRateLimit int = 10
)

func IngredientsRouter(api echo.Group) (err error) {
	group := api.Group("/ingredients",
		middleware.RemoveTrailingSlash(),
		middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(rate.Limit(IngredientsRateLimit))),
	)
	group.GET("/", get_all_ingredients)
	group.GET("/:ingredient_id", get_ingredient)
	group.GET("/search", search_ingredients)
	group.POST("/detection", detect_ingredients)
	return
}

// Get all ingredients
//
//	@Summary		Get all ingredients
//	@Description	Retrieve the full list of ingredients from the database
//	@Tags			ingredients
//	@Produce		json
//	@Success		200	{array}		database.Ingredient	"List of ingredients"
//	@Failure		500	{string}	string				"Server error"
//	@Router			/ingredients [get]
func get_all_ingredients(c echo.Context) (err error) {
	ingredients, err := ingredients_service.GetAllIngredients(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, ingredients)
}

// Get ingredient by ID
//
//	@Summary		Get ingredient
//	@Description	Retrieve a single ingredient by its ID
//	@Tags			ingredients
//	@Produce		json
//	@Param			ingredient_id	path		string				true	"Ingredient ID"
//	@Success		200				{object}	database.Ingredient	"Ingredient"
//	@Failure		500				{string}	string				"Server error"
//	@Router			/ingredients/{ingredient_id} [get]
func get_ingredient(c echo.Context) (err error) {
	ingredient_id := c.Param("ingredient_id")
	ingredient, err := ingredients_service.GetIngredient(c.Request().Context(), ingredient_id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, ingredient)
}

// Search ingredients
//
//	@Summary		Search ingredients
//	@Description	Search ingredients by a query string
//	@Tags			ingredients
//	@Produce		json
//	@Param			q	query		string				true	"Search query"
//	@Success		200	{array}		database.Ingredient	"List of matching ingredients"
//	@Failure		500	{string}	string				"Server error"
//	@Router			/ingredients/search [get]
func search_ingredients(c echo.Context) (err error) {
	query := c.QueryParam("q")
	ingredients, err := ingredients_service.SearchIngredients(c.Request().Context(), query)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, ingredients)
}

// waiting api
func detect_ingredients(c echo.Context) (err error) {
	return
}

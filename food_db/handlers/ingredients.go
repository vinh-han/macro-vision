package handlers

import (
	"io"
	"macro_vision/config"
	ingredients_service "macro_vision/services/ingredients"
	"mime/multipart"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/time/rate"
)

const (
	IngredientsRateLimit float32 = 5
)

func IngredientsRouter(api *echo.Group) (err error) {
	group := api.Group("/ingredients",
		middleware.RemoveTrailingSlash(),
		middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(rate.Limit(IngredientsRateLimit))),
	)
	group.GET("/search", search_ingredients)
	group.GET("/:ingredient_id", get_ingredient)
	group.POST("/detection", detect_ingredients)
	return
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
//	@Param			q	query		string				false	"Search query"
//	@Success		200	{array}		database.Ingredient	"List of matching ingredients"
//	@Failure		500	{string}	string				"Server error"
//	@Router			/ingredients/search [get]
func search_ingredients(c echo.Context) (err error) {
	query := c.QueryParam("q")
	if query == "" {
		query = "%"
	} else {
		query = "%" + query + "%"
	}
	ingredients, err := ingredients_service.SearchIngredients(c.Request().Context(), query)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}
	return c.JSON(http.StatusOK, ingredients)
}

// waiting api
func detect_ingredients(c echo.Context) (err error) {
	file, err := c.FormFile("img-file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "cannot find file input")
	}
	if config.Env.PRODUCTION == "" || config.Env.PRODUCTION != "true" {
		return detect_mock(c, file)
	}
	return
}

func detect_mock(c echo.Context, file *multipart.FileHeader) (err error) {
	src, err := file.Open()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "cannot read file input")
	}
	defer src.Close()
	dst, err := os.Create(file.Filename)
	if err != nil {
		return err
	}
	defer dst.Close()
	if _, err = io.Copy(dst, src); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

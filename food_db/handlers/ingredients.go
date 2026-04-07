package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"macro_vision/config"
	"macro_vision/database"
	ingredients_service "macro_vision/services/ingredients"
	"mime/multipart"
	"net/http"
	"os"
	"time"

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
	group.POST("/detect", detect_ingredients)
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

type DetectIngredientsResponse struct {
	Ingredients []database.Ingredient `json:"ingredients"`
}

// Detect ingredients from image
//
//	@Summary		Detect ingredients from image
//	@Description	Upload an image file to detect ingredients
//	@Tags			ingredients
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			file	formData	file						true	"Image file"
//	@Success		200		{array}		DetectIngredientsResponse	"List of detected ingredients"
//	@Failure		400		{string}	string						"Bad request"
//	@Failure		500		{string}	string						"Server error"
//	@Router			/ingredients/detect [post]
func detect_ingredients(c echo.Context) (err error) {
	file, err := c.FormFile("img-file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "cannot find file input")
	}
	if config.Env.PRODUCTION == "" || config.Env.PRODUCTION != "true" {
		return detect_mock(c, file)
	}
	ingredients, err := detect(c, file)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err)
	}

	return c.JSON(http.StatusOK, DetectIngredientsResponse{
		Ingredients: ingredients,
	})
}

type ModelResponse struct {
	Detections []string `json:"detections"`
}

func detect(c echo.Context, file *multipart.FileHeader) (ingredients []database.Ingredient, err error) {
	image_data, err := file.Open()
	if err != nil {
		return ingredients, echo.NewHTTPError(http.StatusInternalServerError, "could not read data")
	}
	defer image_data.Close()

	buffer := &bytes.Buffer{}
	mpw := multipart.NewWriter(buffer)
	file_writer, err := mpw.CreateFormFile("file", file.Filename)

	_, err = io.Copy(file_writer, image_data)
	if err != nil {
		return nil, err
	}
	err = mpw.Close()
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	ai_api_url := fmt.Sprintf("http://%s:%s/detect/main", config.Env.MODEL_HOST, config.Env.MODEL_PORT)
	req, err := http.NewRequest("POST", ai_api_url, buffer)
	response, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	model_response := &ModelResponse{}
	if err := json.Unmarshal(body, model_response); err != nil {
		return nil, err
	}
	for _, detection := range model_response.Detections {
		ing, err := database.DB.Queries.Get_exact_ingredient(c.Request().Context(), detection)
		if errors.Is(err, sql.ErrNoRows) {
			err = nil
			continue
		}
		ingredients = append(ingredients, ing)
	}
	return ingredients, nil
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
	ingredients, err := database.DB.Queries.Search_ingredients(c.Request().Context(), "egg")
	if errors.Is(err, sql.ErrNoRows) {
		err = nil
	}
	if err != nil {
		return err
	}
	time.Sleep(5 * time.Second)
    return c.JSON(http.StatusOK, DetectIngredientsResponse{
        Ingredients: ingredients,
    })
}

package handlers

import (
	"net/http"
	"time"

	"golang.org/x/time/rate"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4/middleware"

	dish_service "macro_vision/services/dishes"

	"github.com/labstack/echo/v4"
)

const (
	DefaultLimit    int = 12
	DishesRateLimit int = 10
)

func DishesRouter(api *echo.Group) (err error) {
	group := api.Group("/dishes",
		middleware.RemoveTrailingSlash(),
		middleware.RateLimiter(middleware.NewRateLimiterMemoryStore(rate.Limit(DishesRateLimit))),
	)
	group.GET("/search", search_dishes)
	group.GET("/:dish_id", get_dish)
	group.POST("/suggestion", suggest_dish)
	return
}

type SearchDishesResponse struct {
	PageNumber   int                         `json:"page"`
	Limit        int                         `json:"limit"`
	TotalResults int                         `json:"total_results"`
	TotalPages   int                         `json:"total_pages"`
	Dishes       []dish_service.DishResponse `json:"dishes"`
}

// Search dishes
//
//	@Summary		Search dishes with filters and pagination
//	@Description	Search dishes by name, course list, and ingredient count range. Results are paginated and include total match count.
//	@Tags			dishes
//	@Accept			json
//	@Produce		json
//	@Param			q				query		string					false	"Search query for dish name"
//	@Param			course			query		[]string				false	"Filter by course (can be repeated)"
//	@Param			min_ingredients	query		int						false	"Minimum number of ingredients"
//	@Param			max_ingredients	query		int						false	"Maximum number of ingredients"
//	@Param			limit			query		int						false	"Number of results per page (default: 12)"
//	@Param			page			query		int						false	"Page number (1-based)"
//	@Success		200				{object}	SearchDishesResponse	"Search results"
//	@Failure		400				{string}	string					"Invalid query parameters"
//	@Failure		500				{string}	string					"Server error"
//	@Router			/dishes/search [get]
func search_dishes(c echo.Context) (err error) {
	var response *SearchDishesResponse
	var param dish_service.SearchDishParam
	if err = c.Bind(&param); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	if param.Limit == 0 {
		param.Limit = DefaultLimit
	}
	if param.Page < 1 {
		param.Page = 1
	}
	matches, dishes, err := dish_service.SearchDishes(c.Request().Context(), param)
	dishes_cleaned := make([]Dish, len(dishes))
	for _, v := range dishes {
		var temp Dish
		temp.DishID = v.DishID
		temp.DishName = v.DishName
		temp.Course = v.Course
		temp.FullRecipe = v.FullRecipe
		temp.Source = v.FullRecipe
		temp.Description = v.Description
		temp.DateCreated = v.DateCreated
		if v.AltName.Valid == false {
			temp.AltName = ""
		} else {
			temp.AltName = v.AltName.String
		}
		dishes_cleaned = append(dishes_cleaned, temp)
	}
	response = &SearchDishesResponse{
		PageNumber:   param.Page,
		Limit:        param.Limit,
		TotalResults: matches,
		TotalPages:   (matches + param.Limit - 1) / param.Limit,
		Dishes:       dishes_cleaned,
	}
	return c.JSON(http.StatusOK, response)
}

// waiting api
func suggest_dish(c echo.Context) (err error) {
	return
}

// Get dish by ID
//
//	@Summary		Get dish details
//	@Description	Retrieve a single dish by its UUID. If the dish does not exist, an empty object is returned.
//	@Tags			dishes
//	@Accept			json
//	@Produce		json
//	@Param			dish_id	path		string			true	"Dish UUID"
//	@Success		200		{object}	database.Dish	"Dish details"
//	@Failure		400		{string}	string			"Invalid dish ID"
//	@Failure		500		{string}	string			"Server error"
//	@Router			/dishes/{dish_id} [get]
func get_dish(c echo.Context) (err error) {
	dish_id := c.Param("dish_id")
	dish, err := dish_service.GetDish(c.Request().Context(), dish_id)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, dish)
}

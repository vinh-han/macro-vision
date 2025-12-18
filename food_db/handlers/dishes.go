package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4/middleware"

	dish_service "macro_vision/services/dishes"

	"github.com/labstack/echo/v4"
)

const (
	DishesGroup string = "/dishes"
	SearchPath  string = "/search"
)

func DishesRouter(api *echo.Group) (err error) {
	group := api.Group(DishesGroup, middleware.RemoveTrailingSlash())
	group.GET(SearchPath, search_dishes)
	group.GET("/:dish_id", get_dish)
	return
}

type SearchDishesResponse struct {
	PageNumber   int                       `json:"page"`
	Limit        int                       `json:"limit"`
	TotalResults int                       `json:"total_results"`
	TotalPages   int                       `json:"total_pages"`
	Dishes       []dish_service.DishResult `json:"dishes"`
}

// Search dishes
//
//	@Summary		Search dishes with filters and pagination
//	@Description	Search dishes by name, course list, and ingredient count range. Results are paginated and include total match count.
//	@Tags			/dishes
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
		param.Limit = 12
	}
	if param.Page < 1 {
		param.Page = 1
	}
	matches, dishes, err := dish_service.SearchDishes(c.Request().Context(), param)
	response = &SearchDishesResponse{
		PageNumber:   param.Page,
		Limit:        param.Limit,
		TotalResults: matches,
		TotalPages:   (matches + param.Limit - 1) / param.Limit,
		Dishes:       dishes,
	}
	return c.JSON(http.StatusOK, response)
}

func get_dish(c echo.Context) (err error) {
	dish_id := c.Param("dish_id")
	dish, err := dish_service.GetDish(c.Request().Context(), dish_id)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, dish)
}

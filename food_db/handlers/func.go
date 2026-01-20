package handlers

import (
	"github.com/labstack/echo/v4"
)

func InitRouters(api *echo.Group) error {
	AuthRouter(api)
	DishesRouter(api)
	IngredientsRouter(api)
	MealCardRouter(api)
	UsersRouter(api)
	return nil
}

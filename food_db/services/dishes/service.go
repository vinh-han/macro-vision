package dishes

import (
	"context"
	"database/sql"
	"fmt"
	"macro_vision/custom_errors"
	"macro_vision/database"

	"github.com/google/uuid"
)

func GetDish(ctx context.Context, dish_id string) (dish database.Dish, err error) {
	dish_uuid, err := uuid.Parse(dish_id)
	if err != nil {
		return database.Dish{}, fmt.Errorf("%w: %v", custom_errors.UuidParseFailed, err)
	}
	dish, err = database.DB.Queries.Get_dish(ctx, dish_uuid)
	if err == sql.ErrNoRows {
		dish = database.Dish{}
		err = nil
	}
	if err != nil {
		return database.Dish{}, err
	}

	return
}

type SearchDishParam struct {
	Query          string   `query:"q"`
	Courses        []string `query:"course"`
	MinIngredients int      `query:"min_ingredients"`
	MaxIngredients int      `query:"max_ingredients"`
	Limit          int      `query:"limit"`
	Page           int      `query:"page"`
}
type DishResult struct {
	DishID      uuid.UUID `json:"dish_id"`
	DishName    string    `json:"dish_name"`
	Course      string    `json:"course"`
	AltName     string    `json:"alt_name`
	Description string    `json:"description"`
}

func SearchDishes(ctx context.Context, param SearchDishParam) (matches int, results []DishResult, err error) {
	rows, err := database.DB.Queries.Search_dishes(ctx, database.Search_dishesParams{
		Query:          param.Query,
		Courses:        param.Courses,
		MinIngredients: int32(param.MinIngredients),
		MaxIngredients: int32(param.MaxIngredients),
		OffsetValue:    int32((param.Page - 1) * param.Limit),
		ReturnLimit:    int32(param.Limit),
	})
	if err != nil {
		return 0, nil, err
	}
	if len(rows) == 0 {
		return 0, []DishResult{}, nil
	}
	results = make([]DishResult, 0, len(rows))
	for i, v := range rows {
		if i == 0 {
			matches = int(v.Matches)
		}
		results = append(results, DishResult{
			DishID:      v.DishID,
			DishName:    v.DishName,
			Course:      v.Course,
			AltName:     v.AltName,
			Description: v.Description,
		})
	}
	return
}

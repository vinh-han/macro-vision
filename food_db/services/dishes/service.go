package dishes

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"macro_vision/custom_errors"
	"macro_vision/database"
	"time"

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

type SuggestDishesParam struct {
	IngredientList []string `json:"ingredient_list"`
	MatchTightness int      `json:"match_tightness" validate:"omitempty"`
	Page           int      `json:"page" validate:"omitempty"`
}

type SuggestedDish struct {
	DishID           uuid.UUID `json:"dish_id"`
	DishName         string    `json:"dish_name"`
	Course           string    `json:"course"`
	AltName          string    `json:"alt_name"`
	Description      string    `json:"description"`
	MatchCount       int       `json:"match_count"`
	TotalIngredients int       `json:"total_ingredients"`
	Score            float32   `json:"score"`
}

func SuggestDishes(ctx context.Context, param SuggestDishesParam) (dishes []SuggestedDish, err error) {
	tmp, err := database.DB.Queries.Suggest_dish_from_ingredients(ctx, database.Suggest_dish_from_ingredientsParams{
		IngredientList: param.IngredientList,
		MatchTightness: int32(param.MatchTightness),
		PageOffset:     int32(param.Page),
	})
	if errors.Is(err, sql.ErrNoRows) {
		err = nil
		return []SuggestedDish{}, err
	}
	if err != nil {
		return []SuggestedDish{}, err
	}
	for _, tmp_dish := range tmp {
		var dish SuggestedDish
		if tmp_dish.AltName.Valid {
			dish.AltName = tmp_dish.AltName.String
		} else {
			dish.AltName = ""
		}
		dish.DishID = tmp_dish.DishID
		dish.DishName = tmp_dish.DishName
		dish.Course = tmp_dish.Course
		dish.Description = tmp_dish.Description
		dish.MatchCount = int(tmp_dish.MatchedCount)
		dish.TotalIngredients = int(tmp_dish.TotalIngredients)
		dish.Score = float32(tmp_dish.Score)

		dishes = append(dishes, dish)
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

type DishResponse struct {
	DishID      uuid.UUID `json:"dish_id"`
	DishName    string    `json:"dish_name"`
	Course      string    `json:"course"`
	AltName     string    `json:"alt_name"`
	Description string    `json:"description"`
	DateCreated time.Time `json:"date_created"`
}

func SearchDishes(ctx context.Context, param SearchDishParam) (matches int, results []DishResponse, err error) {
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
		return 0, []DishResponse{}, nil
	}
	results = make([]DishResponse, 0, len(rows))
	for i, v := range rows {
		if i == 0 {
			matches = int(v.Matches)
		}
		results = append(results, DishResponse{
			DishID:   v.DishID,
			DishName: v.DishName,
			Course:   v.Course,
			AltName: func() string {
				if v.AltName.Valid {
					return v.AltName.String
				} else {
					return ""
				}
			}(),
			Description: v.Description,
		})
	}
	return
}

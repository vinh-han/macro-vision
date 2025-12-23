package ingredients

import (
	"context"
	"database/sql"
	"fmt"
	"macro_vision/custom_errors"
	"macro_vision/database"

	"github.com/google/uuid"
)

func GetAllIngredients(ctx context.Context) (ingredients []database.Ingredient, err error) {
	ingredients, err = database.DB.Queries.Get_all_ingredients(ctx)
	if err == sql.ErrNoRows {
		err = nil
		return
	}
	if err != nil {
		return
	}
	return
}

func GetIngredient(ctx context.Context, ingredient_id string) (ingredient database.Ingredient, err error) {
	ingredient_uuid, err := uuid.Parse(ingredient_id)
	if err != nil {
		err = fmt.Errorf("%w, %v", custom_errors.UuidParseFailed, err)
		return
	}

	ingredient, err = database.DB.Queries.Get_one_ingredient(ctx, ingredient_uuid)
	if err == sql.ErrNoRows {
		err = nil
		return
	}
	if err != nil {
		return
	}
	return
}

func SearchIngredients(ctx context.Context, query string) (ingredients []database.Ingredient, err error) {
	ingredients, err = database.DB.Queries.Search_ingredients(ctx, query)
	if err == sql.ErrNoRows {
		err = nil
		return
	}
	if err != nil {
		return
	}

	return
}

package mealcards

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

type MealCardDish struct {
	MealCard database.MealCard
	Dishes   []database.Dish
}

type GetMealCardWithDishesParam struct {
	UserID uuid.UUID `json:"-"`
	CardID uuid.UUID `json:"card_id"`
}

func GetMealCardWithDishes(ctx context.Context, request GetMealCardWithDishesParam) (meal_card MealCardDish, err error) {
	mc, err := database.DB.Queries.Get_card_with_id(ctx, database.Get_card_with_idParams{
		UserID: request.UserID,
		CardID: request.CardID,
	})
	if err == sql.ErrNoRows {
		err = nil
		return
	}
	if err != nil {
		return
	}
	d, err := database.DB.Queries.Get_dishes_in_meal_card(ctx, request.CardID)
	if err == sql.ErrNoRows {
		err = nil
		return
	}
	if err != nil {
		return
	}
	dishes := make([]database.Dish, len(d))
	for i, v := range d {
		dishes[i] = database.Dish{
			DishID:      v.DishID,
			DishName:    v.DishName,
			Course:      v.Course,
			AltName:     v.AltName,
			FullRecipe:  v.FullRecipe,
			Source:      v.Source,
			Description: v.Description,
			DateCreated: v.DateCreated,
		}
	}
	meal_card = MealCardDish{
		MealCard: mc,
		Dishes:   dishes,
	}
	return
}

type GetMealCardsDailyParam struct {
	UserID uuid.UUID `json:"-"`
	Date   time.Time `json:"meal_date"`
}

func GetMealCardsDaily(ctx context.Context, param GetMealCardsDailyParam) (meal_cards []database.MealCard, err error) {
	meal_cards, err = database.DB.Queries.Get_meal_cards_daily(ctx, database.Get_meal_cards_dailyParams{
		UserID:   param.UserID,
		MealDate: param.Date,
	})
	if err == sql.ErrNoRows {
		err = nil
		return
	}
	if err != nil {
		return
	}
	return
}

type GetMealCardsMonthlyParam struct {
	UserID uuid.UUID `json:"-"`
	Date   time.Time `json:"meal_date"`
}

func GetMealCardsMonthly(ctx context.Context, param GetMealCardsMonthlyParam) (meal_cards []database.MealCard, err error) {
	meal_cards, err = database.DB.Queries.Get_meal_cards_daily(ctx, database.Get_meal_cards_dailyParams{
		MealDate: param.Date,
		UserID:   param.UserID,
	})
	if err == sql.ErrNoRows {
		err = nil
		return
	}
	if err != nil {
		return
	}
	return
}

type CreateMealCardParam struct {
	UserID   uuid.UUID `json:"-"`
	Title    string    `json:"title"`
	MealDate time.Time `json:"meal_date"`
	Dishes   []string  `json:"dishes"`
}
type MealCardDishID struct {
	MealCard database.MealCard
	DishesID uuid.UUIDs
}

func CreateMealCard(ctx context.Context, param CreateMealCardParam) (meal_card MealCardDishID, err error) {
	dishes_uuid := make(uuid.UUIDs, len(param.Dishes))
	if len(param.Dishes) != 0 {
		for i, v := range param.Dishes {
			dishes_uuid[i], err = uuid.Parse(v)
			if err != nil {
				return MealCardDishID{}, fmt.Errorf("%w, %v", custom_errors.UuidParseFailed, err)
			}
		}
	}
	mc, err := database.DB.Queries.Create_meal_card(ctx, database.Create_meal_cardParams{
		CardID:      uuid.New(),
		UserID:      param.UserID,
		Title:       param.Title,
		MealDate:    param.MealDate,
		DateCreated: time.Now().UTC(),
	})
	if err != nil {
		return
	}
	if len(param.Dishes) != 0 {
		err = database.DB.Queries.Add_dishes_to_card(ctx, database.Add_dishes_to_cardParams{
			CardID:  mc.CardID,
			Column2: dishes_uuid,
		})
		if err != nil {
			return
		}
	}
	meal_card = MealCardDishID{
		MealCard: mc,
		DishesID: dishes_uuid,
	}
	return
}

type RemoveMealCardParam struct {
	UserID uuid.UUID `json:"-"`
	CardID uuid.UUID
}

func RemoveMealCard(ctx context.Context, param RemoveMealCardParam) (removed_uuid uuid.UUID, err error) {
	removed_uuid, err = database.DB.Queries.Remove_card(ctx, database.Remove_cardParams{
		CardID: param.CardID,
		UserID: param.UserID,
	})
	return
}

type UpdateMealCardParam struct {
	UserID   uuid.UUID `json:"-"`
	Title    string    `json:"title"`
	MealDate time.Time `json:"meal_date"`
}

// TODO: might need refactoring after tests
func UpdateMealCard(ctx context.Context, param UpdateMealCardParam) (meal_card database.MealCard, err error) {
	meal_card, err = database.DB.Queries.Update_meal_card_info(ctx, database.Update_meal_card_infoParams{
		Title:    param.Title,
		UserID:   param.UserID,
		MealDate: param.MealDate,
	})
	if err != nil {
		return
	}
	return
}

type AddDishToCardParam struct {
	UserID uuid.UUID `json:"-"`
	CardID uuid.UUID `json:"card_id"`
	DishID uuid.UUID `json:"dish_id"`
}

func AddDishToCard(ctx context.Context, param AddDishToCardParam) (card_id uuid.UUID, err error) {
	_, err = database.DB.Queries.Get_card_with_id(ctx, database.Get_card_with_idParams{
		CardID: param.CardID,
		UserID: param.UserID,
	})
	if err == sql.ErrNoRows {
		err = fmt.Errorf("%w, %v", custom_errors.UnauthorizedOperation, err)
		return
	}
	card_id, err = database.DB.Queries.Add_dish_to_card(ctx, database.Add_dish_to_cardParams{
		CardID: param.CardID,
		DishID: param.DishID,
	})
	if err != nil {
		return
	}
	return
}

type RemoveDishFromCardParam struct {
	UserID uuid.UUID `json:"-"`
	CardID uuid.UUID `json:"card_id"`
	DishID uuid.UUID `json:"dish_id"`
}

func RemoveDishFromCard(ctx context.Context, param RemoveDishFromCardParam) (removed_id uuid.UUID, err error) {
	_, err = database.DB.Queries.Get_card_with_id(ctx, database.Get_card_with_idParams{
		CardID: param.CardID,
		UserID: param.UserID,
	})
	if errors.Is(err, sql.ErrNoRows) {
		err = fmt.Errorf("%w, %v", custom_errors.UnauthorizedOperation, err)
		return
	}
	removed_id, err = database.DB.Queries.Remove_dish_from_card(ctx, database.Remove_dish_from_cardParams{
		CardID: param.CardID,
		DishID: param.DishID,
	})
	if err != nil {
		return
	}
	return
}

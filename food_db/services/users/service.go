package users

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"macro_vision/custom_errors"
	"macro_vision/database"

	"golang.org/x/crypto/bcrypt"

	"github.com/google/uuid"
)

type EditUserParam struct {
	DisplayName string `json:"display_name" example:"phantom_1234"`
	Email       string `json:"email" example:"ranto@example.com"`
}

func EditUser(ctx context.Context, user database.User, param *EditUserParam) (new_info database.Edit_userRow, err error) {
	new_info, err = database.DB.Queries.Edit_user(ctx, database.Edit_userParams{
		UserID:      user.UserID,
		DisplayName: param.DisplayName,
		Email:       param.Email,
	})
	if err != nil {
		return database.Edit_userRow{}, err
	}
	return
}

func GetFavorites(ctx context.Context, user database.User) (favorites []database.Get_favoritesRow, err error) {
	favorites, err = database.DB.Queries.Get_favorites(ctx, user.UserID)
	if errors.Is(err, sql.ErrNoRows) {
		favorites = []database.Get_favoritesRow{}
		err = nil
	}
	if err != nil {
		return []database.Get_favoritesRow{}, err
	}

	return
}

func AddFavorites(ctx context.Context, dish_id string, user database.User) (updated_id string, err error) {
	dish_uuid, err := uuid.Parse(dish_id)
	if err != nil {
		return "", fmt.Errorf("%w: %v", custom_errors.UuidParseFailed, err)
	}
	new_id, err := database.DB.Queries.Add_favorites(ctx, database.Add_favoritesParams{
		UserID: user.UserID,
		DishID: dish_uuid,
	})
	if err != nil {
		return "", err
	}
	updated_id = new_id.String()
	return
}

func RemoveFavorite(ctx context.Context, dish_id string, user database.User) (updated_id string, err error) {
	dish_uuid, err := uuid.Parse(dish_id)
	if err != nil {
		return "", fmt.Errorf("%w: %v", custom_errors.UuidParseFailed, err)
	}
	new_id, err := database.DB.Queries.Remove_favorite(ctx, database.Remove_favoriteParams{
		UserID: user.UserID,
		DishID: dish_uuid,
	})
	if err != nil {
		return "", err
	}
	updated_id = new_id.String()
	return
}

type ChangePasswordParam struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func ChangePassword(ctx context.Context, user database.User, param *ChangePasswordParam) (err error) {
	if err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(param.CurrentPassword)); err != nil {
		return fmt.Errorf("%w: %v", custom_errors.InvalidInput, err)
	}
	new_hash, err := database.GenPassword(param.NewPassword)
	if err != nil {
		return err
	}
	err = database.DB.Queries.Change_password(ctx, database.Change_passwordParams{
		UserID:       user.UserID,
		PasswordHash: string(new_hash),
	})
	return
}

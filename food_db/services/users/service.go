package users

import (
	"context"
	"macro_vision/database"
)

func GetUser(ctx context.Context, token string) (user database.User, err error) {
	user, err = database.DB.Queries.Get_user_from_token(ctx, token)
	if err != nil {
		return database.User{}, err
	}
	return user, err
}

type EditUserParam struct {
	DisplayName string `json:"display_name" example:"phantom_1234"`
	Email       string `json:"email" example:"ranto@example.com"`
}

func EditUser(ctx context.Context, token string, param *EditUserParam) (display_name string, email string, err error) {
	user, err := GetUser(ctx, token)
	if err != nil {
		return "", "", err
	}
	new_info, err := database.DB.Queries.Edit_user(ctx, database.Edit_userParams{
		UserID:      user.UserID,
		DisplayName: param.DisplayName,
		Email:       param.Email,
	})
	if err != nil {
		return "", "", err
	}
	display_name, email = new_info.DisplayName, new_info.Email
	return
}

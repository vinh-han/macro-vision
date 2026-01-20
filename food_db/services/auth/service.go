package auth

import (
	"context"
	"database/sql"
	"errors"
	custom_errors "macro_vision/custom_errors"
	database "macro_vision/database"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"

	"golang.org/x/crypto/bcrypt"
)

type LoginParam struct {
	Username string `json:"username" example:"ranto"`
	Password string `json:"password" example:"11111"`
}

// Login returns a token if the user is already in the db
//
// # This func creates a session in the db if the user exists
//
// Errors:
//   - DbNotInit
//   - UserNotFound
//   - InvalidCredentials
//   - TokenGenFailed
func Login(ctx context.Context, user LoginParam) (token string, err error) {
	if database.DB == nil {
		return "", custom_errors.DbNotInit
	}
	queries := database.DB.Queries
	user_db, err := queries.Get_user_from_name(ctx, user.Username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", custom_errors.UserNotFound
		}
		return "", err
	}
	err = bcrypt.CompareHashAndPassword([]byte(user_db.PasswordHash), []byte(user.Password))
	if err != nil {
		return "", custom_errors.InvalidCredentials
	}
	token, err = database.Create_session(ctx, user_db.UserID)
	if err != nil {
		return "", custom_errors.TokenGenFailed
	}
	return token, nil
}

type SignupParam struct {
	Username    string `json:"username" example:"ranto"`
	DisplayName string `json:"display_name" example:"phantom"`
	Email       string `json:"email" example:"ranto@example.com"`
	Password    string `json:"password" example:"1233445"`
}

// Register returns a token if the user is new
//
// # This func creates a session and user in the db
//
// Errors:
//   - DbNotInit
//   - UserExists
//   - PasswordTooLong
//   - TokenGenFailed
//   - PasswordGenFailed
func Signup(ctx context.Context, user SignupParam) (token string, err error) {
	if database.DB == nil {
		return "", custom_errors.DbNotInit
	}
	if len(user.Password) > 71 {
		return "", custom_errors.PasswordTooLong
	}
	queries := database.DB.Queries
	password_hash, err := database.GenPassword(user.Password)
	if err != nil {
		return "", err
	}

	user_id, err := queries.Insert_user(ctx, database.Insert_userParams{
		UserID:       uuid.New(),
		Username:     user.Username,
		DisplayName:  user.DisplayName,
		Email:        user.Email,
		PasswordHash: string(password_hash),
		DateCreated:  time.Now(),
	})
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		if pqErr.Code == "23505" {
			return "", custom_errors.UserExists
		}
	}
	if err != nil {
		return "", err
	}

	token, err = database.Create_session(ctx, user_id)
	if err != nil {
		return "", err
	}
	return token, err
}

func Logout(ctx context.Context, token string) (err error) {
	err = database.DB.Queries.Remove_session(ctx, token)
	// ignoring some errors since this is logout
	if err != nil {
		return err
	}
	return nil
}

package database

import (
	"context"
	"crypto/rand"
	"database/sql"
	_ "embed"
	"encoding/hex"
	"fmt"
	config "macro_vision/config"
	custom_errors "macro_vision/custom_errors"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/google/uuid"

	_ "github.com/lib/pq"
)

type DB_Connection struct {
	Db      *sql.DB
	Queries *Queries
}

var DB *DB_Connection

// load the schemas into variables
//
//go:embed ddl/schema.sql
var db_ddl string

func InitDB() error {
	ctx := context.Background()
	var connection_string string = fmt.Sprintf(
		"postgres://%s:%s@database:%s/%s?sslmode=disable",
		config.Env.POSTGRES_USER,
		config.Env.POSTGRES_PASSWORD,
		config.Env.POSTGRES_PORT,
		config.Env.POSTGRES_DB,
	)
	db, err := sql.Open("postgres", connection_string)
	if err != nil {
		return fmt.Errorf("%w: connection_string:%s.\n %v", custom_errors.DbInitFailed, connection_string, err)
	}
	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("%w: unable to reach DB at %s. %v", custom_errors.DbInitFailed, connection_string, err)
	}

	if _, err := db.ExecContext(ctx, db_ddl); err != nil {
		return fmt.Errorf("%w: connection_string:%s.\n %v", custom_errors.DbInitFailed, connection_string, err)
	}

	queries := New(db)
	DB = &DB_Connection{
		Db:      db,
		Queries: queries,
	}
	return nil
}

func GetUser(ctx context.Context, token string) (user User, err error) {
	user, err = DB.Queries.Get_user_from_token(ctx, token)
	if err == sql.ErrNoRows {
		return User{}, fmt.Errorf("%w: %v", custom_errors.SessionNotFound, err)
	}
	if err != nil {
		return User{}, err
	}
	return user, err
}

func GenPassword(password string) (hash []byte, err error) {
	hash, err = bcrypt.GenerateFromPassword([]byte(password), config.Auth.BcryptCost)
	if err != nil {
		return []byte{}, fmt.Errorf("%w: %v", custom_errors.PasswordGenFailed, err)
	}
	return
}

func CloseDB() {
	DB.Db.Close()
}

// generate_session_token generates a random 256 bit opaque token
func generate_session_token() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func Remove_Session(ctx context.Context, session_token string) error {
	err := DB.Queries.Remove_session(ctx, session_token)
	if err != nil {
		return err
	}
	return nil
}

func Create_session(ctx context.Context, user_id uuid.UUID) (token string, err error) {
	token, err = generate_session_token()
	if err != nil {
		return "", err
	}
	token_expiration_hr, err := time.ParseDuration(config.Env.TOKEN_EXPIRATION)
	if err != nil {
		return "", fmt.Errorf("%w, user_id:%s", custom_errors.TokenGenFailed, user_id)
	}
	err = DB.Queries.Insert_session(ctx, Insert_sessionParams{
		SessionID:   uuid.New(),
		UserID:      user_id,
		Token:       token,
		ExpiresAt:   time.Now().Add(token_expiration_hr),
		DateCreated: time.Now(),
	})
	if err != nil {
		return "", err
	}
	return token, nil
}

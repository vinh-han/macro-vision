package database

import (
	"context"
	"crypto/rand"
	"database/sql"
	_ "embed"
	"encoding/hex"
	"errors"
	"fmt"
	"io/fs"
	config "macro_vision/config"
	custom_errors "macro_vision/custom_errors"
	"os"
	"regexp"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"

	_ "github.com/mattn/go-sqlite3"
	// _ "modernc.org/sqlite"
)

type DB_Connection struct {
	Db      *sql.DB
	Queries *Queries
}

var (
	db_connections map[string]*DB_Connection = make(map[string]*DB_Connection)
	db_mutex       sync.Mutex
	session_db     *DB_Connection
	Recipe_db      *DB_Connection
)

// load the schemas into variables

//go:embed ddl/sessions_schema.sql
var session_db_ddl string

//go:embed ddl/users_schema.sql
var user_db_ddl string

//go:embed ddl/recipes_schema.sql
var recipes_db_ddl string

func InitDbs() error {
	var err error
	err = create_recipe_db()
	if err != nil {
		return err
	}
	err = create_session_db()
	if err != nil {
		return err
	}
	return nil
}

func create_recipe_db() error {
	ctx := context.Background()
	var db_path string = config.Env.DB_PATH + config.Env.RECIPE_DB_NAME
	db, err := sql.Open("sqlite3", db_path)
	if err != nil {
		return fmt.Errorf("%w: db_path%s: %v", custom_errors.RecipeDbInitFailed, db_path, err)
	}
	if _, err := db.ExecContext(ctx, recipes_db_ddl); err != nil {
		return fmt.Errorf("%w: db_path%s: %v", custom_errors.RecipeDbInitFailed, db_path, err)
	}
	queries := New(db)
	Recipe_db = &DB_Connection{
		Db:      db,
		Queries: queries,
	}
	return nil
}

func create_session_db() error {
	ctx := context.Background()
	var db_path string = config.Env.DB_PATH + config.Env.SESSIONS_DB_NAME
	db, err := sql.Open("sqlite3", db_path)
	if err != nil {
		return fmt.Errorf("%w: db_path%s: %v", custom_errors.SessionDbInitFailed, db_path, err)
	}

	if _, err := db.ExecContext(ctx, session_db_ddl); err != nil {
		return fmt.Errorf("%w: db_path%s: %v", custom_errors.SessionDbInitFailed, db_path, err)
	}

	queries := New(db)
	session_db = &DB_Connection{
		Db:      db,
		Queries: queries,
	}
	return nil
}

func CloseSessionDb() {
	session_db.Db.Close()
}

// GetSessionFromToken checks if the session is expired in the db and retrive the session if not
//
// Errors:
//   - SessionExpired - the session has been expired
func GetSessionFromToken(ctx context.Context, session_token string) (*Session, error) {
	if session_db == nil {
		return nil, custom_errors.SessionDbNotInitialized
	}
	queries := session_db.Queries

	session, err := queries.Get_session(ctx, session_token)
	if err != nil {
		return nil, err
	}

	if time.Now().After(session.ExpiresAt) {
		err = queries.Remove_session(ctx, session_token)
		if err != nil {
			return nil, err
		}
		return nil, custom_errors.SessionExpired
	}
	return &session, nil
}

var banned_regex *regexp.Regexp = regexp.MustCompile(`[^a-zA-Z0-9_-]`)

func is_valid_username(username string) bool {
	return banned_regex.Match([]byte(username))
}

// returns the user_db object from uuid
//
// Errors:
//   - UserNotFound - uuid not found in fs
func GetDB(username string) (*DB_Connection, error) {
	db_mutex.Lock()
	defer db_mutex.Unlock()

	// return pre exisiting connection if exists
	if connection, ok := db_connections[username]; ok {
		return connection, nil
	}

	// check if the user is in db dir
	var user_db_path string = config.Env.DB_PATH + username + ".sqlite"
	if _, err := os.Stat(user_db_path); errors.Is(err, fs.ErrNotExist) {
		return nil, custom_errors.UserNotFound
	}

	db, err := sql.Open("sqlite3", user_db_path)
	if err != nil {
		return nil, err
	}

	queries := New(db)
	user_db := &DB_Connection{
		Db:      db,
		Queries: queries,
	}

	db_connections[username] = user_db

	return db_connections[username], nil
}

// makes a random 256 bit opaque token
func generate_session_token() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func Remove_Session(ctx context.Context, session_token string) error {
	err := session_db.Queries.Remove_session(ctx, session_token)
	if err != nil {
		return err
	}
	return nil
}

func CreateSession(ctx context.Context, username string) (*Session, error) {
	token, err := generate_session_token()
	if err != nil {
		return nil, err
	}
	token_expiration_hr, err := time.ParseDuration(config.Env.TOKEN_EXPIRATION)
	if err != nil {
		return nil, err
	}
	session, err := session_db.Queries.Insert_session(ctx, Insert_sessionParams{
		Username:    username,
		Token:       token,
		ExpiresAt:   time.Now().Add(token_expiration_hr * time.Hour),
		DateCreated: time.Now(),
	})
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func CreateDB(ctx context.Context, username string, password string) error {
	// check if main db dir exists, if not create it
	if _, err := os.Stat(config.Env.DB_PATH); errors.Is(err, fs.ErrNotExist) {
		os.Mkdir(config.Env.DB_PATH, os.ModePerm)
	}

	if is_valid_username(username) {
		return custom_errors.InvalidUsername
	}
	var user_db_path string = config.Env.DB_PATH + username + ".sqlite"

	db, err := sql.Open("sqlite3", user_db_path)
	if err != nil {
		return err
	}

	if _, err := db.ExecContext(ctx, user_db_ddl); err != nil {
		return err
	}

	password_hash, err := bcrypt.GenerateFromPassword([]byte(password), 4)
	if err != nil {
		return err
	}

	queries := New(db)
	err = queries.Insert_user_info(ctx, Insert_user_infoParams{
		PasswordHash: string(password_hash),
		DateCreated:  time.Now(),
	})
	if err != nil {
		return err
	}

	return nil
}

func CheckUserExists(username string) error {
	if _, err := os.Stat(config.Env.DB_PATH + username + ".sqlite"); err == nil {
		return custom_errors.UserDbExists
	}
	return nil
}

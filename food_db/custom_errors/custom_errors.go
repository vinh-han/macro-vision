package custom_errors

import (
	"errors"
)

var (
	LemmetizerInitFailed      = errors.New("Something went wrong when initializing the lemmetizer.")
	DocumentGenerationFailed  = errors.New("Something went wrong when generating document from res body.")
	IngredientsFileOpenFailed = errors.New("Something went wrong when opening the ingredients file.")
	GetPageFailed             = errors.New("Something went wrong when getting the page contents")
	RecipeDbInitFailed        = errors.New("Something went wrong when initializing the recipe db.")
	SessionDbInitFailed       = errors.New("Something went wrong when initializing the session db.")
	UserNotFound              = errors.New("user does not exist.")
	InvalidInput              = errors.New("This input cannot be empty.")
	UserDbExists              = errors.New("user is already registered.")
	InvalidUsername           = errors.New("username is not usable.")
	InvalidCredentials        = errors.New("Invalid username or password")
	PasswordTooLong           = errors.New("This password exceeds the limit!")
	SessionDbExists           = errors.New("Session Db already exists.")
	SessionExpired            = errors.New("This session has expired, please log in again.")
	SessionDbNotInitialized   = errors.New("Session db has not been initialized.")
	EnvEmpty                  = errors.New("env var has not been initialized.")
	LinkSaveFailed            = errors.New("failed when saving a course.")
)

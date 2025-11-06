package custom_errors

import (
	"errors"
)

var (
	LemmetizerInitFailed      = errors.New("Something went wrong when initializing the lemmetizer.")
	DocumentGenerationFailed  = errors.New("Something went wrong when generating document from res body.")
	IngredientsFileOpenFailed = errors.New("Something went wrong when opening the ingredients file.")
	GetPageFailed             = errors.New("Something went wrong when getting the page contents")
	DbInitFailed              = errors.New("Something went wrong when initializing the db.")
	DbNotInit                 = errors.New("The main DB has not been initialized.")
	UserNotFound              = errors.New("user does not exist.")
	UserExists                = errors.New("user is already registered.")
	InvalidInput              = errors.New("This input cannot be empty.")
	InvalidUsername           = errors.New("username is not usable.")
	InvalidCredentials        = errors.New("Invalid username or password")
	PasswordTooLong           = errors.New("This password exceeds the limit!")
	SessionExpired            = errors.New("This session has expired, please log in again.")
	EnvEmpty                  = errors.New("env var has not been initialized.")
	LinkSaveFailed            = errors.New("failed when saving a course.")
	TokenGenFailed            = errors.New("token generation failed")
)

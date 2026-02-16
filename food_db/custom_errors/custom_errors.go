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
	UserNotFound              = errors.New("User does not exist.")
	SessionLimit              = errors.New("User has too many sessions. Please log off.")
	UserExists                = errors.New("User is already registered.")
	InvalidInput              = errors.New("This input cannot be empty.")
	UuidParseFailed           = errors.New("UUID could not be parsed.")
	InvalidUsername           = errors.New("Username is not usable.")
	InvalidCredentials        = errors.New("Invalid username or password")
	PasswordTooLong           = errors.New("This password exceeds the limit!")
	SessionExpired            = errors.New("This session has expired, please log in again.")
	SessionNotFound           = errors.New("Session not found in db.")
	EnvEmpty                  = errors.New("Env var has not been initialized.")
	LinkSaveFailed            = errors.New("Failed when saving a course.")
	TokenGenFailed            = errors.New("Token generation failed")
	PasswordGenFailed         = errors.New("Failed to generate password")
	UnauthorizedOperation     = errors.New("This user is not permitted to operate on this resource")
)

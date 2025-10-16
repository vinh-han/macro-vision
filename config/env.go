package config

type EnvConfig struct {
	RECIPE_DB_NAME      string
	DB_PATH             string
	SESSIONS_DB_NAME    string
	TOKEN_EXPIRATION    string
	SESSION_COOKIE_NAME string
	LINKS_FOLDER        string
	USER_AGENT          string
}

var Env *EnvConfig = &EnvConfig{}

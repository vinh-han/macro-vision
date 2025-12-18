package config

type EnvConfig struct {
	TOKEN_EXPIRATION    string
	SESSION_COOKIE_NAME string
	LINKS_FOLDER        string
	USER_AGENT          string
	BACKEND_PORT        string
	FRONTEND_PORT       string
	POSTGRES_PORT       string
	POSTGRES_USER       string
	POSTGRES_PASSWORD   string
	POSTGRES_DB         string
}

var Env *EnvConfig = &EnvConfig{}

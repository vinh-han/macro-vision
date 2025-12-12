package config

import "golang.org/x/crypto/bcrypt"

type AppConfig struct {
	BasePath string
	DocPath  string
}

type AuthConfig struct {
	AuthGroup    string
	LoginPath    string
	RegisterPath string
	LogoutPath   string
	BcryptCost   int
}

const (
	Links_file_extension string = ".cmo"
	Mainfile_name        string = "all_recipe_links.wow"
	Wait_per_req_s_max   int    = 3
	Base_url             string = "https://vickypham.com/recipes-finder/?_cuisine=vietnamese&_courses=%s&query-0-page=%d"
	Recipe_url_template  string = "https://vickypham.com/blog/"
	Course_delim         string = "---- "
	Ingredients_filename string = "all_ingredients.yikes"
)

var Auth AuthConfig = AuthConfig{
	AuthGroup:    "/auth",
	LoginPath:    "/login",
	RegisterPath: "/signup",
	LogoutPath:   "/logout",
	BcryptCost:   bcrypt.DefaultCost,
}

var App AppConfig = AppConfig{
	BasePath: "/v1",
	DocPath:  "/docs",
}

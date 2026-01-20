package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	config "macro_vision/config"
	"macro_vision/database"
	docs "macro_vision/docs"
	env_parser "macro_vision/env_parser"
	handlers "macro_vision/handlers"
	custom_middleware "macro_vision/middleware"
	processor "macro_vision/processor"
	scraper "macro_vision/scraper"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"
)

const (
	env_path string = "./.env"
)

//	@title			Macro_vision backend
//	@version		1.0
//	@description	API for Macro_vision

func corsConfig() middleware.CORSConfig {
	return middleware.CORSConfig{
		AllowOrigins: []string{
			"http://localhost:" + config.Env.FRONTEND_PORT,
			"http://127.0.0.1:" + config.Env.FRONTEND_PORT,
		},
		AllowHeaders: []string{
			echo.HeaderOrigin,
			echo.HeaderContentType,
			echo.HeaderAccept,
			echo.HeaderAuthorization,
		},
		AllowMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowCredentials: true,
	}
}

func init() {
	var err error
	err = env_parser.LoadConfig(env_path)
	if err != nil {
		log.Fatal(err)
	}
	docs.SwaggerInfo.Host = "127.0.0.1:" + config.Env.BACKEND_PORT
	docs.SwaggerInfo.BasePath = config.App.BasePath

	err = database.InitDB()
	if err != nil {
		log.Fatal(err)
	}
	err = scraper.Scrape()
	if err != nil {
		log.Fatal(err)
	}

	_, err = database.DB.Queries.GetInfo(context.Background())
	if err == sql.ErrNoRows {
		err = processor.Process_recipes()
		if err != nil {
			log.Fatal(err)
		}
	}
	if err != nil {
		log.Fatal(err)
	}
}

func main() {
	e := echo.New()
	custom_middleware.SetupLogger(e)
	e.Use(middleware.CORSWithConfig(corsConfig()))

	// doc path
	e.GET(config.App.DocPath+"/*", echoSwagger.WrapHandler)
	fmt.Println(config.App.DocPath + "/*")
	e.GET("/", func(c echo.Context) error {
		return c.Redirect(http.StatusSeeOther, config.App.DocPath+"/")
	})

	api := e.Group(config.App.BasePath)

	handlers.InitRouters(api)

	fmt.Printf("\n==================================\n")
	fmt.Printf("\nAccess the Docs via domain root (http://<domain>:<port>/)\n")
	fmt.Printf("\n==================================\n")
	e.Logger.Fatal(e.Start(":" + config.Env.BACKEND_PORT))
}

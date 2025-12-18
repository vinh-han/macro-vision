package main

import (
	"fmt"
	"log"
	config "macro_vision/config"
	docs "macro_vision/docs"
	env_parser "macro_vision/env_parser"
	handlers "macro_vision/handlers"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"
)

const (
	env_path string = "./.env"
)

var cors_config middleware.CORSConfig = middleware.CORSConfig{
	AllowOrigins: []string{"http://frontend:" + config.Env.FRONTEND_PORT},
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
}

//	@title			Macro_vision backend
//	@version		1.0
//	@description	API for Macro_vision

func main() {
	var err error
	err = env_parser.LoadConfig(env_path)
	if err != nil {
		log.Fatal(err)
	}

	docs.SwaggerInfo.Host = "127.0.0.1:" + config.Env.BACKEND_PORT
	docs.SwaggerInfo.BasePath = config.App.BasePath

	e := echo.New()
	e.Use(middleware.CORSWithConfig(cors_config))
	// doc path
	e.GET(config.App.DocPath+"/*", echoSwagger.WrapHandler)
	fmt.Println(config.App.DocPath + "/*")
	e.GET("/", func(c echo.Context) error {
		return c.Redirect(http.StatusSeeOther, config.App.DocPath+"/")
	})

	api := e.Group(config.App.BasePath)
	handlers.AuthRouter(api)
	fmt.Printf("\n==================================\n")
	fmt.Printf("\nAccess the Docs via domain root (http://<domain>:<port>/)\n")
	fmt.Printf("\n==================================\n")
	e.Logger.Fatal(e.Start(":" + config.Env.BACKEND_PORT))
}

//err = database.InitDB()
//if err != nil {
//	log.Fatal(err.Error())
//}
//err = scraper.Scrape()
//if err != nil {
//	log.Fatal(err)
//}

//_, err = database.DB.Queries.GetInfo(context.Background())
//if err == sql.ErrNoRows {
//	err = processor.Process_recipes()
//	if err != nil {
//		log.Fatal(err)
//	}
//}
//if err != nil {
//	log.Fatal(err)
//}
//for true {
//	time.Sleep(time.Second * 10)
//	fmt.Println("===============================================================================================================")
//	time.Sleep(time.Second * 10)
//}

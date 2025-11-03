package main

import (
	"log"
	database "macro_vision/database"
	env_parser "macro_vision/env_parser"
	processor "macro_vision/processor"
	scraper "macro_vision/scraper"
)

const (
	env_path string = ".env"
)

func main() {
	var err error

	err = env_parser.LoadConfig(env_path)
	if err != nil {
		log.Fatal(err)
	}
	err = database.InitDbs()
	if err != nil {
		log.Fatal(err.Error())
	}

	err = scraper.Scrape()
	if err != nil {
		log.Fatal(err)
	}
	err = processor.Process_recipes()
	if err != nil {
		log.Fatal(err)
	}
}

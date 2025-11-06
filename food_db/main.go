package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	database "macro_vision/database"
	env_parser "macro_vision/env_parser"
	processor "macro_vision/processor"
	scraper "macro_vision/scraper"
	"time"
)

const (
	env_path string = "./.env"
)

func main() {
	var err error

	err = env_parser.LoadConfig(env_path)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("a;lskdjf")
	err = database.InitDB()
	if err != nil {
		log.Fatal(err.Error())
	}
	err = scraper.Scrape()
	if err != nil {
		log.Fatal(err)
	}

	info, err := database.DB.Queries.GetInfo(context.Background())
	if err == sql.ErrNoRows {
		err = processor.Process_recipes()
		if err != nil {
			log.Fatal(err)
		}
	}
	if err != nil {
		log.Fatal(err)
	}
	if time.Since(info.LastScraped) > time.Hour*24 {
		err = processor.Process_recipes()
		if err != nil {
			log.Fatal(err)
		}
	}
	for true {
		time.Sleep(time.Second * 10)
		fmt.Println("===============================================================================================================")
		time.Sleep(time.Second * 10)
	}
}

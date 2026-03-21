package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"golang.org/x/time/rate"

	"github.com/joho/godotenv"
)

const (
	BaseUrl          string = "https://ssl-api.openfoodfacts.org/cgi/search.pl"
	ImageBucketUrl   string = "https://openfoodfacts-images.s3.eu-west-3.amazonaws.com/data/"
	EnvLocation      string = "./.env"
	TmpDir           string = "./tmp/scraper-cache"
	MaxImages        int    = 5
	ImagesDir        string = "./images/"
	Delim            string = "---"
	numWorkersURL    int    = 4
	numWorkersImages int    = 16
	debug            bool   = true
)

type (
	Dish       string
	Ingredient string
)

var db *sql.DB

var (
	limiter *rate.Limiter = rate.NewLimiter(rate.Every(8*time.Second), 1)
	client  *http.Client  = &http.Client{}
	ua      string        = ""
)

func main() {
	err := godotenv.Load(EnvLocation)
	if err != nil {
		log.Fatal(err)
	}
	var ok bool
	ua, ok = os.LookupEnv("USER_AGENT")
	if !ok {
		log.Fatal("user agent not defined")
	}
	initDb()
	var (
		dishes      []Dish
		ingredients []Ingredient
	)
	log.Println("getting names from db")
	dishes, ingredients, err = getNameData()
	if err != nil {
		log.Fatal(err)
	}
	log.Println("getting links from names")
	err = getImageUrls(dishes, ingredients)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("getting images from links")
	err = getImages()
	if err != nil {
		log.Fatal(err)
	}
	err = postProcess()
	if err != nil {
		log.Fatal(err)
	}
}

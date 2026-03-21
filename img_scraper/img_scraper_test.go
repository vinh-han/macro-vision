package main

// this file is for testing during dev only
// actual testing is outside and check for side effects since this program contains little logic

import (
	"log"
	"testing"

	"github.com/joho/godotenv"
)

var dishes []Dish = []Dish{
	"pork_sausage",
	"spring roll",
}

var ingredients []Ingredient = []Ingredient{
	"lettuce",
	"cucumber",
}

func init() {
	godotenv.Load("../.env")
}

func TestGetUrl(t *testing.T) {
	err := getImageUrls(dishes, ingredients)
	if err != nil {
		log.Fatal(err)
	}
}

func TestGetImages(t *testing.T) {
	err := getImages()
	if err != nil {
		log.Fatal(err)
	}
}

func TestPostProcessing(t *testing.T) {
	err := postProcess()
	if err != nil {
		log.Fatal(err)
	}
}

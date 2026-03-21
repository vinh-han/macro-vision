package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"
)

func initDb() {
	var (
		postgres_user     string
		postgres_password string
		postgres_database string
		postgres_host     string
	)
	var postgres_config map[string]string = map[string]string{
		"POSTGRES_USER":     postgres_user,
		"POSTGRES_PASSWORD": postgres_password,
		"POSTGRES_DB":       postgres_database,
		"POSTGRES_HOST":     postgres_host,
	}
	for key := range postgres_config {
		value, ok := os.LookupEnv(key)
		if !ok {
			log.Fatalf("%s, env not defined", key)
		}
		postgres_config[key] = value
	}
	var connection_string string = fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		postgres_config["POSTGRES_USER"],
		postgres_config["POSTGRES_PASSWORD"],
		postgres_config["POSTGRES_HOST"],
		postgres_config["POSTGRES_PORT"],
		postgres_config["POSTGRES_DB"],
	)
	var err error
	db, err = sql.Open("postgres", connection_string)
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatal(err)
	}
}

func getNameData() (dishes []Dish, ingredients []Ingredient, err error) {
	rows, err := db.Query(`
        SELECT ingredient_name, NULL FROM ingredients
        UNION ALL
        SELECT NULL, dish_name FROM dishes;
	`)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var ingredientName sql.NullString
		var dishName sql.NullString

		if err = rows.Scan(&ingredientName, &dishName); err != nil {
			return
		}

		if ingredientName.Valid {
			norm := toSnakeName(ingredientName.String)
			ingredients = append(ingredients, Ingredient(norm))
		}

		if dishName.Valid {
			norm := toSnakeName(dishName.String)
			dishes = append(dishes, Dish(norm))
		}
	}
	err = rows.Err()
	return
}

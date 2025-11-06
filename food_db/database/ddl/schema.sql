CREATE TABLE IF NOT EXISTS "db_info" (
	"version" uuid primary key,
	"last_scraped" timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS "sessions" (
  "session_id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "token" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "date_created" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "user_id" uuid PRIMARY KEY,
  "username" text UNIQUE NOT NULL,
  "display_name" text NOT NULL,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "date_created" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "favorites" (
  "user_id" uuid NOT NULL,
  "dish_id" uuid NOT NULL,
  "date_created" timestamptz NOT NULL,
  PRIMARY KEY ("user_id", "dish_id")
);

CREATE TABLE IF NOT EXISTS "meal_cards" (
  "card_id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "meal_date" timestamptz NOT NULL,
  "date_created" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "meal_cards_dishes" (
  "card_id" uuid NOT NULL,
  "dish_id" uuid NOT NULL,
  PRIMARY KEY ("card_id", "dish_id")
);

CREATE TABLE IF NOT EXISTS "dishes" (
  "dish_id" uuid PRIMARY KEY,
  "dish_name" text NOT NULL,
  "course" text NOT NULL,
  "alt_name" text,
  "full_recipe" text NOT NULL,
  "source" text NOT NULL,
  "description" text NOT NULL,
  "date_created" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "ingredients" (
  "ingredient_id" uuid PRIMARY KEY,
  "ingredient_name" text NOT NULL,
  "date_created" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "dish_ingredients" (
  "dish_id" uuid NOT NULL,
  "ingredient_id" uuid NOT NULL,
  "amount" real NOT NULL,
  "unit" text NOT NULL
);

ALTER TABLE "sessions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

ALTER TABLE "favorites" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

ALTER TABLE "favorites" ADD FOREIGN KEY ("dish_id") REFERENCES "dishes" ("dish_id");

ALTER TABLE "meal_cards" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

ALTER TABLE "meal_cards_dishes" ADD FOREIGN KEY ("card_id") REFERENCES "meal_cards" ("card_id");

ALTER TABLE "meal_cards_dishes" ADD FOREIGN KEY ("dish_id") REFERENCES "dishes" ("dish_id");

ALTER TABLE "dish_ingredients" ADD FOREIGN KEY ("dish_id") REFERENCES "dishes" ("dish_id");

ALTER TABLE "dish_ingredients" ADD FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("ingredient_id");


-- Users: quick lookup by username or email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sessions: lookup by token or user
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Dishes: search or filter by name or course
CREATE INDEX IF NOT EXISTS idx_dishes_name ON dishes(dish_name);
CREATE INDEX IF NOT EXISTS idx_dishes_course ON dishes(course);

-- Ingredients: lookup by name
CREATE UNIQUE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(ingredient_name);

-- Favorites: often queried by user
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- Meal cards: filter by user or date
CREATE INDEX IF NOT EXISTS idx_meal_cards_user ON meal_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_cards_meal_date ON meal_cards(meal_date);


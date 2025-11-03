CREATE TABLE IF NOT EXISTS user_info (
	name TEXT NOT NULL,
	display_name TEXT NOT NULL,
	email TEXT NOT NULL,
	password_hash TEXT NOT NULL,
	date_created timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
	dish_id INTEGER PRIMARY KEY,
	date_created timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_cards (
	card_id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	meal_date timestamp NOT NULL,
	recipe_id_list TEXT NOT NULL,
	date_created timestamp NOT NULL
);


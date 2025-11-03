CREATE TABLE IF NOT EXISTS dishes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL, 
	course TEXT NOT NULL, 
	alt_name TEXT, 
	full_recipe TEXT NOT NULL,
	source TEXT NOT NULL,
	description TEXT NOT NULL,
	date_created TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredients (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT UNIQUE NOT NULL, 
	date_created TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS dish_ingredients (
	dish_id INTEGER NOT NULL, 
	ingredient_id INTEGER NOT NULL,
	amount REAL NOT NULL,
	unit TEXT NOT NULL,
	foreign key (dish_id) references dishes(id),
	foreign key (ingredient_id) references ingredients(id)
);

-- other static dbs
CREATE TABLE IF NOT EXISTS ingredient_macros (
	ingredient_id INTEGER NOT NULL,
	per_grams REAL NOT NULL DEFAULT 100,  -- reference amount, e.g. per 100 g
	calories REAL NOT NULL,               -- kcal
	protein REAL NOT NULL,                -- grams
	fat REAL NOT NULL,                    -- grams
	carbs REAL NOT NULL,                  -- grams
	fiber REAL NOT NULL,                  -- grams
	FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
	PRIMARY KEY (ingredient_id, per_grams)
);

-- these are here because sqlc cannot handle multi schema for now
-- these should be an empty table
-- these should be synced with the sessions_schema.sql and others
CREATE TABLE IF NOT EXISTS sessions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL,
	token TEXT NOT NULL,
	expires_at TIMESTAMP NOT NULL,
	date_created TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_info (
	password_hash TEXT NOT NULL,
	date_created TIMESTAMP NOT NULL
);


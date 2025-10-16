-- this is here because sqlc cannot handle multi schema for now
-- this should be an empty table
-- this should be synced with the sessions_db.sql 
CREATE TABLE IF NOT EXISTS sessions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL,
	token TEXT NOT NULL,
	expires_at TIMESTAMP NOT NULL,
	date_created TIMESTAMP NOT NULL
);


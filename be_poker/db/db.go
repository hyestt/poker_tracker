package db

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	"log"
)

var DB *sql.DB

func InitDB(filepath string) {
	var err error
	DB, err = sql.Open("sqlite3", filepath)
	if err != nil {
		log.Fatal("Cannot open database:", err)
	}
	createTables()
}

func createTables() {
	sessionTable := `CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		location TEXT,
		date TEXT,
		small_blind INTEGER,
		big_blind INTEGER,
		currency TEXT,
		effective_stack INTEGER
	);`
	_, err := DB.Exec(sessionTable)
	if err != nil {
		log.Fatal("Cannot create sessions table:", err)
	}

	handTable := `CREATE TABLE IF NOT EXISTS hands (
		id TEXT PRIMARY KEY,
		session_id TEXT,
		hole_cards TEXT,
		position TEXT,
		details TEXT,
		result INTEGER,
		date TEXT,
		analysis TEXT,
		analysis_date TEXT,
		FOREIGN KEY(session_id) REFERENCES sessions(id)
	);`
	_, err = DB.Exec(handTable)
	if err != nil {
		log.Fatal("Cannot create hands table:", err)
	}
} 
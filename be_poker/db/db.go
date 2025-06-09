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
	
	// 測試資料庫連接
	if err = DB.Ping(); err != nil {
		log.Fatal("Cannot ping database:", err)
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
		effective_stack INTEGER,
		table_size INTEGER DEFAULT 6,
		tag TEXT
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
		favorite INTEGER DEFAULT 0,
		FOREIGN KEY(session_id) REFERENCES sessions(id)
	);`
	_, err = DB.Exec(handTable)
	if err != nil {
		log.Fatal("Cannot create hands table:", err)
	}
} 
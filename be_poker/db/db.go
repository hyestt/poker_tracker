package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() error {
	// 優先使用Railway PostgreSQL環境變數
	var dbURL string
	
	// Railway會自動注入PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT
	if pgHost := os.Getenv("PGHOST"); pgHost != "" {
		pgUser := os.Getenv("PGUSER")
		pgPassword := os.Getenv("PGPASSWORD") 
		pgDatabase := os.Getenv("PGDATABASE")
		pgPort := os.Getenv("PGPORT")
		
		if pgPort == "" {
			pgPort = "5432"
		}
		
		dbURL = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=require",
			pgUser, pgPassword, pgHost, pgPort, pgDatabase)
		log.Printf("🚂 Using Railway PostgreSQL: %s:%s/%s", pgHost, pgPort, pgDatabase)
	} else if envURL := os.Getenv("DATABASE_URL"); envURL != "" {
		// 備用：使用DATABASE_URL環境變數
		dbURL = envURL
		log.Printf("🔗 Using DATABASE_URL")
	} else {
		// 最後備用：Supabase
		dbURL = "postgres://postgres:sbp_a6a3750dc590637eeff1fa4e1c790e24a4163459@db.vdpscuywgjopwvcalgsn.supabase.co:5432/postgres?sslmode=require&connect_timeout=30"
		log.Printf("⚠️  Using fallback Supabase connection")
	}

	var err error
	DB, err = sql.Open("postgres", dbURL)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("✅ Database connected successfully")
	return nil
}

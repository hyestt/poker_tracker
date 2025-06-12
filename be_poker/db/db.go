package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB(filepath string) {
	// 使用 Railway PostgreSQL 連接字串
	railwayURL := "postgresql://postgres:seUSLaxtymEhQHEgSZDdOhpfiPNwelQq@ballast.proxy.rlwy.net:23605/railway"
	
	// 如果有設定環境變數則使用環境變數
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		railwayURL = dbURL
	}
	
	var err error
	DB, err = sql.Open("postgres", railwayURL)
	if err != nil {
		log.Fatal("Cannot open database:", err)
	}
	
	// 測試資料庫連接
	if err = DB.Ping(); err != nil {
		log.Fatal("Cannot ping database:", err)
	}
	
	fmt.Println("✅ Connected to Railway PostgreSQL")
	fmt.Printf("📊 Database connected successfully\n")
}

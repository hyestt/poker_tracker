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
	// 使用 Supabase 連接字串
	supabaseURL := "postgres://postgres.vdpscuywgjopwvcalgsn:Kyy850425%40@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
	
	// 如果有設定環境變數則使用環境變數
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		supabaseURL = dbURL
	}
	
	var err error
	DB, err = sql.Open("postgres", supabaseURL)
	if err != nil {
		log.Fatal("Cannot open database:", err)
	}
	
	// 測試資料庫連接
	if err = DB.Ping(); err != nil {
		log.Fatal("Cannot ping database:", err)
	}
	
	fmt.Println("✅ Connected to Supabase PostgreSQL")
	
	// Supabase 中的表已經存在，不需要創建
	// createTables() 和 migrateTables() 已經不需要了
}

// createTables 和 migrateTables 函數已移除
// 因為 Supabase 中的表結構已經建立完成 
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
	
	// 檢查數據表是否存在，不存在則自動創建
	if err = ensureTablesExist(); err != nil {
		return fmt.Errorf("failed to ensure tables exist: %v", err)
	}

	return nil
}

// 確保數據表存在
func ensureTablesExist() error {
	log.Println("🔍 Checking database schema...")
	
	// 檢查sessions表是否存在且包含所有必需欄位
	var sessionsExists bool
	err := DB.QueryRow(`SELECT EXISTS (
		SELECT FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_name = 'sessions'
	)`).Scan(&sessionsExists)
	
	if err != nil {
		return fmt.Errorf("failed to check sessions table: %v", err)
	}
	
	// 檢查sessions表是否有tag欄位
	var tagColumnExists bool
	if sessionsExists {
		err = DB.QueryRow(`SELECT EXISTS (
			SELECT FROM information_schema.columns 
			WHERE table_schema = 'public' 
			AND table_name = 'sessions'
			AND column_name = 'tag'
		)`).Scan(&tagColumnExists)
		
		if err != nil {
			return fmt.Errorf("failed to check tag column: %v", err)
		}
	}
	
	// 檢查hands表是否存在
	var handsExists bool
	err = DB.QueryRow(`SELECT EXISTS (
		SELECT FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_name = 'hands'
	)`).Scan(&handsExists)
	
	if err != nil {
		return fmt.Errorf("failed to check hands table: %v", err)
	}
	
	// 如果表不存在或結構不完整，重建它們
	if !sessionsExists || !tagColumnExists || !handsExists {
		log.Println("⚠️ Database schema incomplete, recreating tables...")
		
		// 先刪除現有表格（如果存在）以確保乾淨的狀態
		_, err = DB.Exec(`DROP TABLE IF EXISTS hands CASCADE`)
		if err != nil {
			return fmt.Errorf("failed to drop hands table: %v", err)
		}
		
		_, err = DB.Exec(`DROP TABLE IF EXISTS sessions CASCADE`)
		if err != nil {
			return fmt.Errorf("failed to drop sessions table: %v", err)
		}
		
		// 重新創建sessions表（包含所有必需欄位）
		_, err = DB.Exec(`
			CREATE TABLE sessions (
				id TEXT PRIMARY KEY,
				location TEXT DEFAULT '',
				date TEXT DEFAULT '',
				small_blind INTEGER DEFAULT 0,
				big_blind INTEGER DEFAULT 0,
				currency TEXT DEFAULT '',
				effective_stack INTEGER DEFAULT 0,
				table_size INTEGER DEFAULT 6,
				tag TEXT DEFAULT '',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`)
		
		if err != nil {
			return fmt.Errorf("failed to create sessions table: %v", err)
		}
		
		// 重新創建hands表（包含所有必需欄位）
		_, err = DB.Exec(`
			CREATE TABLE hands (
				id TEXT PRIMARY KEY,
				session_id TEXT DEFAULT '',
				position TEXT DEFAULT '',
				hole_cards TEXT DEFAULT '',
				board TEXT DEFAULT '',
				details TEXT DEFAULT '',
				note TEXT DEFAULT '',
				result_amount INTEGER DEFAULT 0,
				date TEXT DEFAULT '',
				villains TEXT DEFAULT '[]',
				analysis TEXT DEFAULT '',
				analysis_date TEXT DEFAULT '',
				is_favorite BOOLEAN DEFAULT FALSE,
				tag TEXT DEFAULT '',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
			)
		`)
		
		if err != nil {
			return fmt.Errorf("failed to create hands table: %v", err)
		}
		
		// 創建索引
		indexes := []string{
			`CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date)`,
			`CREATE INDEX IF NOT EXISTS idx_hands_session_id ON hands(session_id)`,
			`CREATE INDEX IF NOT EXISTS idx_hands_date ON hands(date)`,
			`CREATE INDEX IF NOT EXISTS idx_hands_result_amount ON hands(result_amount)`,
			`CREATE INDEX IF NOT EXISTS idx_hands_is_favorite ON hands(is_favorite)`,
		}
		
		for _, indexSQL := range indexes {
			_, err = DB.Exec(indexSQL)
			if err != nil {
				log.Printf("⚠️ Warning: failed to create index: %v", err)
				// 繼續執行，索引錯誤不應該阻止應用啟動
			}
		}
		
		log.Println("✅ Database schema recreated successfully")
	} else {
		log.Println("✅ Database schema is up to date")
	}
	
	return nil
}

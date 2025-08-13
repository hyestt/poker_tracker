package db

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq" // PostgreSQL driver
	"log"
	"os"
)

var DB *sql.DB

func InitDB() error {
	// 嘗試使用 Railway PostgreSQL 資料庫，如果不可用則跳過
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Printf("⚠️ DATABASE_URL not set - running in API-only mode (analysis features still available)")
		return nil
	}

	log.Printf("🗄️  Using PostgreSQL database from Railway")

	var err error
	DB, err = sql.Open("postgres", databaseURL)
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

	// 檢查sessions表是否存在 (PostgreSQL語法)
	var sessionsExists int
	err := DB.QueryRow(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'sessions'`).Scan(&sessionsExists)
	if err != nil {
		return fmt.Errorf("failed to check sessions table: %v", err)
	}

	// 檢查hands表是否存在 (PostgreSQL語法)
	var handsExists int
	err = DB.QueryRow(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'hands'`).Scan(&handsExists)
	if err != nil {
		return fmt.Errorf("failed to check hands table: %v", err)
	}

	// 如果表不存在，創建它們
	if sessionsExists == 0 || handsExists == 0 {
		log.Println("⚠️ Database schema incomplete, creating tables...")

		// 先刪除現有表格（如果存在）以確保乾淨的狀態
		_, err = DB.Exec(`DROP TABLE IF EXISTS hands CASCADE`)
		if err != nil {
			return fmt.Errorf("failed to drop hands table: %v", err)
		}

		_, err = DB.Exec(`DROP TABLE IF EXISTS sessions CASCADE`)
		if err != nil {
			return fmt.Errorf("failed to drop sessions table: %v", err)
		}

		// 創建sessions表（PostgreSQL語法）
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

		// 創建hands表（PostgreSQL語法）
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

		log.Println("✅ Database schema created successfully")
	} else {
		log.Println("✅ Database schema is up to date")
	}

	return nil
}

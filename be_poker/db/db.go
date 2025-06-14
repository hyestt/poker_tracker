package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	_ "github.com/mattn/go-sqlite3"
	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB() error {
	// 檢測環境並選擇適當的SQLite驅動
	var driverName, dataSourceName string
	
	// 如果是Railway環境或CGO不可用，使用純Go驅動
	if os.Getenv("RAILWAY_ENVIRONMENT") != "" || os.Getenv("CGO_ENABLED") == "0" {
		driverName = "sqlite"  // modernc.org/sqlite (純Go)
		dataSourceName = "file:poker_tracker.db?cache=shared&mode=rwc"
		log.Printf("🗄️  Using pure Go SQLite driver for Railway environment")
	} else {
		driverName = "sqlite3"  // github.com/mattn/go-sqlite3 (需要CGO)
		dataSourceName = "poker_tracker.db"
		log.Printf("🗄️  Using CGO SQLite driver for local development")
	}
	
	log.Printf("🗄️  Database: %s", dataSourceName)

	var err error
	DB, err = sql.Open(driverName, dataSourceName)
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
	
	// 檢查sessions表是否存在
	var sessionsExists int
	err := DB.QueryRow(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='sessions'`).Scan(&sessionsExists)
	if err != nil {
		return fmt.Errorf("failed to check sessions table: %v", err)
	}
	
	// 檢查hands表是否存在
	var handsExists int
	err = DB.QueryRow(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='hands'`).Scan(&handsExists)
	if err != nil {
		return fmt.Errorf("failed to check hands table: %v", err)
	}
	
	// 如果表不存在，創建它們
	if sessionsExists == 0 || handsExists == 0 {
		log.Println("⚠️ Database schema incomplete, creating tables...")
		
		// 先刪除現有表格（如果存在）以確保乾淨的狀態
		_, err = DB.Exec(`DROP TABLE IF EXISTS hands`)
		if err != nil {
			return fmt.Errorf("failed to drop hands table: %v", err)
		}
		
		_, err = DB.Exec(`DROP TABLE IF EXISTS sessions`)
		if err != nil {
			return fmt.Errorf("failed to drop sessions table: %v", err)
		}
		
		// 創建sessions表（包含所有必需欄位）
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
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`)
		
		if err != nil {
			return fmt.Errorf("failed to create sessions table: %v", err)
		}
		
		// 創建hands表（包含所有必需欄位）
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
				is_favorite INTEGER DEFAULT 0,
				tag TEXT DEFAULT '',
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

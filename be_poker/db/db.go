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
	// 檢查sessions表是否存在
	var sessionsExists bool
	err := DB.QueryRow(`SELECT EXISTS (
		SELECT FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_name = 'sessions'
	)`).Scan(&sessionsExists)
	
	if err != nil {
		return fmt.Errorf("failed to check sessions table: %v", err)
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
	
	// 如果表不存在，創建它們
	if !sessionsExists || !handsExists {
		log.Println("⚠️ Tables missing, creating schema...")
		
		// 創建sessions表
		if !sessionsExists {
			_, err = DB.Exec(`
				CREATE TABLE IF NOT EXISTS sessions (
					id text NOT NULL,
					location text NULL,
					date text NULL,
					small_blind integer NULL,
					big_blind integer NULL,
					currency text NULL,
					effective_stack integer NULL,
					table_size integer NULL DEFAULT 6,
					created_at timestamp with time zone NULL DEFAULT now(),
					updated_at timestamp with time zone NULL DEFAULT now(),
					CONSTRAINT sessions_pkey PRIMARY KEY (id)
				)
			`)
			
			if err != nil {
				return fmt.Errorf("failed to create sessions table: %v", err)
			}
			
			_, err = DB.Exec(`CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions USING btree (date)`)
			if err != nil {
				return fmt.Errorf("failed to create sessions index: %v", err)
			}
			
			log.Println("✅ Created sessions table")
		}
		
		// 創建hands表
		if !handsExists {
			_, err = DB.Exec(`
				CREATE TABLE IF NOT EXISTS hands (
					id text NOT NULL,
					session_id text NULL,
					position text NULL,
					hole_cards text NULL,
					details text NULL,
					result_amount integer NULL DEFAULT 0,
					analysis text NULL,
					analysis_date timestamp with time zone NULL,
					is_favorite boolean NULL DEFAULT false,
					tag text NULL,
					created_at timestamp with time zone NULL DEFAULT now(),
					updated_at timestamp with time zone NULL DEFAULT now(),
					board text NULL,
					note text NULL,
					villains text NULL,
					date text NULL,
					CONSTRAINT hands_pkey PRIMARY KEY (id),
					CONSTRAINT hands_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
				)
			`)
			
			if err != nil {
				return fmt.Errorf("failed to create hands table: %v", err)
			}
			
			_, err = DB.Exec(`CREATE INDEX IF NOT EXISTS idx_hands_session_id ON hands USING btree (session_id)`)
			if err != nil {
				return fmt.Errorf("failed to create hands session_id index: %v", err)
			}
			
			_, err = DB.Exec(`CREATE INDEX IF NOT EXISTS idx_hands_is_favorite ON hands USING btree (is_favorite)`)
			if err != nil {
				return fmt.Errorf("failed to create hands is_favorite index: %v", err)
			}
			
			log.Println("✅ Created hands table")
		}
	}
	
	return nil
}

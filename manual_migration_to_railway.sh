#!/bin/bash

# 🚂 手動 Supabase 到 Railway PostgreSQL 遷移腳本
# 使用現有的匯出檔案和 API 來遷移資料

echo "🚂 開始手動 Supabase → Railway PostgreSQL 遷移"
echo "================================================"

# 檢查必要工具
if ! command -v psql &> /dev/null; then
    echo "❌ 錯誤: 需要安裝 PostgreSQL 客戶端 (psql)"
    echo "   安裝方式: brew install postgresql"
    exit 1
fi

# 檢查 Railway 資料庫 URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 錯誤: 請設定 Railway 資料庫 URL"
    echo "   export DATABASE_URL='postgresql://postgres:seUSLaxtymEhQHEgSZDdOhpfiPNwelQq@postgres.railway.internal:5432/railway'"
    exit 1
fi

echo "✅ 使用 Railway URL: ${DATABASE_URL:0:30}..."

# 創建備份目錄
BACKUP_DIR="manual_migration_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 創建備份目錄: $BACKUP_DIR"

# 1. 創建 Railway 資料庫結構
echo ""
echo "🏗️  步驟 1: 創建 Railway 資料庫結構..."

cat > "$BACKUP_DIR/railway_schema.sql" << 'EOF'
-- Railway PostgreSQL Schema for Poker Tracker
-- 清理版本，移除 Supabase 特定功能

-- 創建 sessions 表
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    location TEXT,
    date TEXT,
    small_blind INTEGER,
    big_blind INTEGER,
    currency TEXT,
    effective_stack INTEGER,
    table_size INTEGER DEFAULT 6,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建 hands 表
CREATE TABLE IF NOT EXISTS hands (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    position TEXT,
    hole_cards TEXT,
    details TEXT,
    result_amount INTEGER DEFAULT 0,
    analysis TEXT,
    analysis_date TIMESTAMP WITH TIME ZONE,
    is_favorite BOOLEAN DEFAULT FALSE,
    tag TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    board TEXT,
    note TEXT,
    villains TEXT,
    date TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_hands_session_id ON hands(session_id);
CREATE INDEX IF NOT EXISTS idx_hands_created_at ON hands(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_hands_is_favorite ON hands(is_favorite);
EOF

# 測試 Railway 連接
echo ""
echo "🔗 步驟 2: 測試 Railway 資料庫連接..."
psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Railway 資料庫連接成功"
else
    echo "❌ Railway 資料庫連接失敗"
    echo "   請檢查 DATABASE_URL 是否正確"
    exit 1
fi

# 在 Railway 中創建表結構
echo ""
echo "🏗️  步驟 3: 在 Railway 中創建表結構..."
psql "$DATABASE_URL" -f "$BACKUP_DIR/railway_schema.sql"
if [ $? -eq 0 ]; then
    echo "✅ Railway 表結構創建成功"
else
    echo "❌ Railway 表結構創建失敗"
    exit 1
fi

# 使用現有的匯出檔案
echo ""
echo "📊 步驟 4: 使用現有匯出檔案..."

# 檢查是否有現有的匯出檔案
if [ -f "migration_sessions.sql" ]; then
    echo "✅ 找到 migration_sessions.sql"
    echo "📥 匯入 sessions 資料..."
    psql "$DATABASE_URL" -f "migration_sessions.sql"
    if [ $? -eq 0 ]; then
        echo "✅ Sessions 資料匯入成功"
    else
        echo "⚠️  Sessions 資料匯入有問題，但繼續..."
    fi
else
    echo "⚠️  未找到 migration_sessions.sql，跳過 sessions 匯入"
fi

if [ -f "migration_hands.sql" ]; then
    echo "✅ 找到 migration_hands.sql"
    echo "📥 匯入 hands 資料..."
    psql "$DATABASE_URL" -f "migration_hands.sql"
    if [ $? -eq 0 ]; then
        echo "✅ Hands 資料匯入成功"
    else
        echo "⚠️  Hands 資料匯入有問題，但繼續..."
    fi
else
    echo "⚠️  未找到 migration_hands.sql，跳過 hands 匯入"
fi

# 驗證遷移結果
echo ""
echo "🔍 步驟 5: 驗證遷移結果..."

# 檢查表是否存在
TABLES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('sessions', 'hands');" | tr -d ' ')
if [ "$TABLES_COUNT" -eq 2 ]; then
    echo "✅ 表結構驗證成功 (2/2 表存在)"
else
    echo "❌ 表結構驗證失敗 ($TABLES_COUNT/2 表存在)"
fi

# 檢查資料數量
SESSIONS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM sessions;" 2>/dev/null | tr -d ' ')
HANDS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM hands;" 2>/dev/null | tr -d ' ')

echo "📊 資料驗證結果:"
echo "   Sessions: ${SESSIONS_COUNT:-0} 筆記錄"
echo "   Hands: ${HANDS_COUNT:-0} 筆記錄"

# 更新後端配置
echo ""
echo "⚙️  步驟 6: 更新後端配置..."

# 備份現有配置
cp "be_poker/db/db.go" "$BACKUP_DIR/db.go.backup"

# 創建新的資料庫配置
cat > "be_poker/db/db.go" << EOF
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
	railwayURL := "$DATABASE_URL"
	
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
	fmt.Printf("📊 Database connected successfully\\n")
}
EOF

echo "✅ 後端配置已更新"

# 完成報告
echo ""
echo "🎉 手動遷移完成！"
echo "================================================"
echo "📁 備份檔案位置: $BACKUP_DIR"
echo "📊 遷移統計:"
echo "   - Sessions: ${SESSIONS_COUNT:-0} 筆"
echo "   - Hands: ${HANDS_COUNT:-0} 筆"
echo ""
echo "📋 下一步:"
echo "1. 執行 ./deploy_to_railway.sh 部署後端"
echo "2. 測試 Railway API 連接"
echo "3. 更新前端配置"
echo "4. 測試完整應用功能"
echo ""
echo "🧪 測試 Railway 資料庫:"
echo "   psql \"$DATABASE_URL\" -c \"SELECT COUNT(*) FROM sessions;\""
echo "   psql \"$DATABASE_URL\" -c \"SELECT COUNT(*) FROM hands;\"" 
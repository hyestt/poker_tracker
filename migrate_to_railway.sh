#!/bin/bash

# 🚂 Supabase 到 Railway PostgreSQL 遷移腳本
# 此腳本將完整遷移 Supabase 的資料庫結構和資料到 Railway

echo "🚂 開始 Supabase → Railway PostgreSQL 遷移"
echo "================================================"

# 檢查必要工具
if ! command -v psql &> /dev/null; then
    echo "❌ 錯誤: 需要安裝 PostgreSQL 客戶端 (psql)"
    echo "   安裝方式: brew install postgresql"
    exit 1
fi

# 設定變數
SUPABASE_URL="postgres://postgres.vdpscuywgjopwvcalgsn:Kyy850425%40@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
RAILWAY_URL=""

# 檢查 Railway 資料庫 URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 錯誤: 請設定 Railway 資料庫 URL"
    echo "   請在 Railway 專案中複製 PostgreSQL 連接字串"
    echo "   然後執行: export DATABASE_URL='your_railway_postgres_url'"
    echo ""
    echo "   或者直接提供 URL:"
    read -p "   請輸入 Railway PostgreSQL URL: " RAILWAY_URL
    if [ -z "$RAILWAY_URL" ]; then
        echo "❌ 未提供 Railway URL，退出"
        exit 1
    fi
else
    RAILWAY_URL="$DATABASE_URL"
fi

echo "✅ 使用 Railway URL: ${RAILWAY_URL:0:30}..."

# 創建備份目錄
BACKUP_DIR="railway_migration_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 創建備份目錄: $BACKUP_DIR"

# 1. 匯出 Supabase 資料庫結構
echo ""
echo "📋 步驟 1: 匯出 Supabase 資料庫結構..."
pg_dump "$SUPABASE_URL" --schema-only --no-owner --no-privileges > "$BACKUP_DIR/schema.sql"
if [ $? -eq 0 ]; then
    echo "✅ 資料庫結構匯出成功"
else
    echo "❌ 資料庫結構匯出失敗"
    exit 1
fi

# 2. 匯出 Supabase 資料
echo ""
echo "📊 步驟 2: 匯出 Supabase 資料..."
pg_dump "$SUPABASE_URL" --data-only --no-owner --no-privileges --table=sessions --table=hands > "$BACKUP_DIR/data.sql"
if [ $? -eq 0 ]; then
    echo "✅ 資料匯出成功"
else
    echo "❌ 資料匯出失敗"
    exit 1
fi

# 3. 清理並準備 Railway 專用的 SQL
echo ""
echo "🔧 步驟 3: 準備 Railway 專用 SQL..."

# 創建清理後的結構檔案
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

# 清理資料檔案，移除 Supabase 特定內容
sed 's/public\.//g' "$BACKUP_DIR/data.sql" | \
sed '/^SET /d' | \
sed '/^SELECT pg_catalog/d' | \
sed '/^--/d' | \
grep -v '^$' > "$BACKUP_DIR/railway_data.sql"

echo "✅ Railway 專用 SQL 準備完成"

# 4. 測試 Railway 連接
echo ""
echo "🔗 步驟 4: 測試 Railway 資料庫連接..."
psql "$RAILWAY_URL" -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Railway 資料庫連接成功"
else
    echo "❌ Railway 資料庫連接失敗"
    echo "   請檢查 Railway URL 是否正確"
    exit 1
fi

# 5. 備份現有 Railway 資料（如果有）
echo ""
echo "💾 步驟 5: 備份現有 Railway 資料..."
pg_dump "$RAILWAY_URL" --data-only --no-owner --no-privileges > "$BACKUP_DIR/railway_backup.sql" 2>/dev/null
echo "✅ Railway 現有資料已備份（如果有的話）"

# 6. 在 Railway 中創建表結構
echo ""
echo "🏗️  步驟 6: 在 Railway 中創建表結構..."
psql "$RAILWAY_URL" -f "$BACKUP_DIR/railway_schema.sql"
if [ $? -eq 0 ]; then
    echo "✅ Railway 表結構創建成功"
else
    echo "❌ Railway 表結構創建失敗"
    exit 1
fi

# 7. 匯入資料到 Railway
echo ""
echo "📥 步驟 7: 匯入資料到 Railway..."
psql "$RAILWAY_URL" -f "$BACKUP_DIR/railway_data.sql"
if [ $? -eq 0 ]; then
    echo "✅ 資料匯入 Railway 成功"
else
    echo "❌ 資料匯入 Railway 失敗"
    exit 1
fi

# 8. 驗證遷移結果
echo ""
echo "🔍 步驟 8: 驗證遷移結果..."

# 檢查表是否存在
TABLES_COUNT=$(psql "$RAILWAY_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('sessions', 'hands');")
if [ "$TABLES_COUNT" -eq 2 ]; then
    echo "✅ 表結構驗證成功 (2/2 表存在)"
else
    echo "❌ 表結構驗證失敗 ($TABLES_COUNT/2 表存在)"
fi

# 檢查資料數量
SESSIONS_COUNT=$(psql "$RAILWAY_URL" -t -c "SELECT COUNT(*) FROM sessions;")
HANDS_COUNT=$(psql "$RAILWAY_URL" -t -c "SELECT COUNT(*) FROM hands;")

echo "📊 資料驗證結果:"
echo "   Sessions: $SESSIONS_COUNT 筆記錄"
echo "   Hands: $HANDS_COUNT 筆記錄"

# 9. 更新後端配置
echo ""
echo "⚙️  步驟 9: 更新後端配置..."

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
	railwayURL := "$RAILWAY_URL"
	
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
	fmt.Printf("📊 Database URL: %s...\\n", railwayURL[:30])
}
EOF

echo "✅ 後端配置已更新"

# 10. 更新前端配置
echo ""
echo "📱 步驟 10: 準備前端配置更新..."

# 創建前端配置更新指南
cat > "$BACKUP_DIR/frontend_update_guide.md" << EOF
# 前端配置更新指南

## 需要更新的檔案

### 1. fe_poker/src/config/supabase.ts
將 Supabase 配置改為 Railway API 配置：

\`\`\`typescript
// 移除 Supabase 配置
// import { createClient } from '@supabase/supabase-js';

// 改用 Railway API
const RAILWAY_API_URL = 'https://your-railway-app.railway.app';

export const apiConfig = {
  baseURL: RAILWAY_API_URL,
  timeout: 10000,
};
\`\`\`

### 2. fe_poker/src/viewmodels/sessionStore.ts
將 Supabase 客戶端調用改為 HTTP API 調用

### 3. Railway 部署 URL
部署後端到 Railway，獲取 API URL 並更新前端配置

## 下一步
1. 部署後端到 Railway
2. 獲取 Railway 應用 URL
3. 更新前端 API 配置
4. 測試完整功能
EOF

# 完成報告
echo ""
echo "🎉 遷移完成！"
echo "================================================"
echo "📁 備份檔案位置: $BACKUP_DIR"
echo "📊 遷移統計:"
echo "   - Sessions: $SESSIONS_COUNT 筆"
echo "   - Hands: $HANDS_COUNT 筆"
echo ""
echo "📋 下一步:"
echo "1. 檢查 Railway 資料庫中的資料是否正確"
echo "2. 部署後端到 Railway (./deploy_to_railway.sh)"
echo "3. 更新前端配置指向 Railway API"
echo "4. 測試完整應用功能"
echo ""
echo "📄 詳細指南: $BACKUP_DIR/frontend_update_guide.md"
echo ""
echo "⚠️  重要: 在確認遷移成功前，請保留 Supabase 資料作為備份" 
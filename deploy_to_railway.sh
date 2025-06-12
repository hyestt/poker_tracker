#!/bin/bash

# 🚂 Railway 部署腳本 (配合資料庫遷移)
# 此腳本將後端部署到 Railway，使用遷移後的 PostgreSQL 資料庫

echo "🚂 開始部署到 Railway"
echo "========================"

# 檢查是否已安裝 Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI 未安裝"
    echo "   安裝方式: npm install -g @railway/cli"
    echo "   或訪問: https://railway.app/cli"
    exit 1
fi

# 檢查是否已登入 Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 請先登入 Railway..."
    railway login
fi

echo "✅ Railway CLI 已準備就緒"

# 檢查專案目錄
if [ ! -d "be_poker" ]; then
    echo "❌ 找不到 be_poker 目錄"
    exit 1
fi

# 檢查必要檔案
if [ ! -f "be_poker/main.go" ]; then
    echo "❌ 找不到 be_poker/main.go"
    exit 1
fi

if [ ! -f "be_poker/go.mod" ]; then
    echo "❌ 找不到 be_poker/go.mod"
    exit 1
fi

echo "✅ 後端檔案檢查完成"

# 確保根目錄有正確的配置檔案
echo "🔧 檢查建置配置..."

if [ ! -f "railway.toml" ] && [ ! -f "nixpacks.toml" ]; then
    echo "⚠️  未找到建置配置，創建 nixpacks.toml..."
    cat > nixpacks.toml << 'EOF'
[variables]
GO_VERSION = "1.21"

[phases.setup]
nixPkgs = ["go", "gcc"]

[phases.build]
dependsOn = ["setup"]
cmds = [
    "cd be_poker",
    "go mod tidy", 
    "go build -o main ."
]

[phases.start]
dependsOn = ["build"]
cmd = "cd be_poker && ./main"
EOF
    echo "✅ nixpacks.toml 已創建"
fi

# 檢查是否已有 Railway 專案
if [ ! -f ".railway/project.json" ]; then
    echo "🆕 初始化新的 Railway 專案..."
    railway init
    
    # 檢查是否需要添加 PostgreSQL
    if [ -z "$DATABASE_URL" ]; then
        echo "📦 添加 PostgreSQL 服務..."
        echo "⚠️  由於免費方案限制，請手動在 Railway 控制台添加 PostgreSQL："
        echo "   1. 前往 Railway 控制台: https://railway.app/dashboard"
        echo "   2. 選擇此專案"
        echo "   3. 點擊 'Add Service' -> 'Database' -> 'PostgreSQL'"
        echo "   4. 等待服務初始化完成"
        echo "   5. 複製 DATABASE_URL 環境變數"
        echo "   6. 執行: export DATABASE_URL='你的資料庫URL'"
        echo "   7. 重新執行此腳本"
        echo ""
        read -p "   已經設定好 PostgreSQL 了嗎？(y/N): " POSTGRES_READY
        if [ "$POSTGRES_READY" != "y" ] && [ "$POSTGRES_READY" != "Y" ]; then
            echo "❌ 請先設定 PostgreSQL 服務"
            exit 1
        fi
        
        # 提示輸入 DATABASE_URL
        if [ -z "$DATABASE_URL" ]; then
            echo ""
            echo "請提供 PostgreSQL 連接字串:"
            read -p "DATABASE_URL: " DATABASE_URL
            if [ -z "$DATABASE_URL" ]; then
                echo "❌ 未提供 DATABASE_URL"
                exit 1
            fi
        fi
    fi
else
    echo "✅ 使用現有 Railway 專案"
fi

# 設定環境變數
echo ""
echo "⚙️  設定環境變數..."

# 檢查是否需要設定 OPENAI_API_KEY
if [ -n "$OPENAI_API_KEY" ]; then
    echo "🔑 設定 OpenAI API Key..."
    railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
else
    echo "⚠️  警告: 未設定 OPENAI_API_KEY 環境變數"
    echo "   AI 分析功能將無法使用"
    echo "   可稍後在 Railway 控制台中設定"
fi

# 設定 DATABASE_URL（如果有的話）
if [ -n "$DATABASE_URL" ]; then
    echo "🗄️  設定資料庫 URL..."
    railway variables set DATABASE_URL="$DATABASE_URL"
fi

# 設定 PORT (Railway 會自動提供，但我們可以設預設值)
railway variables set PORT=8080

echo "✅ 環境變數設定完成"

# 顯示當前變數（隱藏敏感資訊）
echo ""
echo "📋 當前環境變數:"
railway variables | grep -E "(PORT|DATABASE_URL|OPENAI_API_KEY)" | sed 's/=.*/=***/'

# 部署應用
echo ""
echo "🚀 開始部署..."
echo "   建置目錄: be_poker"
echo "   建置命令: go mod tidy && go build -o main ."
echo "   啟動命令: ./main"

railway up --detach

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 部署啟動成功！"
    echo "========================"
    
    # 等待部署完成
    echo "⏳ 等待部署完成..."
    sleep 10
    
    # 獲取部署 URL
    RAILWAY_URL=$(railway domain 2>/dev/null)
    if [ -n "$RAILWAY_URL" ]; then
        echo "🌐 應用 URL: https://$RAILWAY_URL"
        echo ""
        echo "📋 API Endpoints:"
        echo "   - GET  https://$RAILWAY_URL/sessions"
        echo "   - POST https://$RAILWAY_URL/sessions"
        echo "   - GET  https://$RAILWAY_URL/hands"
        echo "   - POST https://$RAILWAY_URL/hands"
        echo "   - POST https://$RAILWAY_URL/analyze"
        echo ""
        echo "🔧 下一步:"
        echo "1. 測試 API: curl https://$RAILWAY_URL/sessions"
        echo "2. 更新前端配置使用此 URL"
        echo "3. 測試完整應用功能"
        
        # 創建前端配置更新檔案
        cat > "railway_frontend_config.ts" << EOF
// Railway 前端配置
// 請將此配置更新到 fe_poker/src/config/ 中

export const API_CONFIG = {
  BASE_URL: 'https://$RAILWAY_URL',
  ENDPOINTS: {
    SESSIONS: '/sessions',
    HANDS: '/hands',
    ANALYZE: '/analyze',
  },
  TIMEOUT: 10000,
};

// 使用方式:
// const response = await fetch(\`\${API_CONFIG.BASE_URL}\${API_CONFIG.ENDPOINTS.SESSIONS}\`);
EOF
        
        echo ""
        echo "📄 前端配置已生成: railway_frontend_config.ts"
        
        # 測試 API
        echo ""
        echo "🧪 測試 API 連接..."
        if curl -s "https://$RAILWAY_URL" > /dev/null; then
            echo "✅ API 回應正常"
        else
            echo "⚠️  API 可能仍在啟動中，請稍後測試"
        fi
        
    else
        echo "⚠️  無法獲取部署 URL"
        echo "   請在 Railway 控制台查看部署狀態"
        echo "   URL: https://railway.app/dashboard"
    fi
    
    # 顯示日誌資訊
    echo ""
    echo "📊 查看部署日誌:"
    echo "   railway logs"
    echo ""
    echo "🔧 管理專案:"
    echo "   railway dashboard  # 開啟控制台"
    echo "   railway status     # 查看狀態"
    echo "   railway variables  # 查看變數"
    
else
    echo ""
    echo "❌ 部署失敗"
    echo "請檢查以下項目:"
    echo "1. Railway 控制台的錯誤訊息: railway logs"
    echo "2. 建置配置是否正確"
    echo "3. 環境變數是否設定正確"
    echo "4. 資料庫連接是否正常"
    echo ""
    echo "🔍 除錯命令:"
    echo "   railway logs        # 查看錯誤日誌"
    echo "   railway status      # 查看服務狀態"
    echo "   railway dashboard   # 開啟控制台"
    exit 1
fi 
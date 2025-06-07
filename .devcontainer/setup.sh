#!/bin/bash

# 設置環境變數配置
echo "🔧 設置開發環境..."

# 複製環境變數模板（如果不存在 .env 文件）
if [ ! -f ".devcontainer/.env" ]; then
    echo "📋 複製環境變數模板..."
    cp .devcontainer/environment.template .devcontainer/.env
    echo "⚠️  請編輯 .devcontainer/.env 並設置你的 OPENAI_API_KEY"
fi

# 載入環境變數
if [ -f ".devcontainer/.env" ]; then
    echo "🔑 載入環境變數..."
    export $(cat .devcontainer/.env | grep -v '^#' | xargs)
fi

# 設置 Go 環境
echo "🚀 設置 Go 環境..."
go version

# 安裝 Go 依賴
cd be_poker
echo "📦 安裝 Go 依賴..."
go mod tidy
go mod download

# 預編譯 backend
echo "🔨 預編譯 backend..."
go build -o poker_tracker_backend

cd ..

# 設置 Node.js 環境
echo "📱 設置 React Native 環境..."
cd fe_poker

# 安裝 npm 依賴
echo "📦 安裝 npm 依賴..."
npm install

# 設置 React Native CLI
npm install -g @react-native-community/cli

cd ..

# 創建資料庫
echo "🗄️  初始化資料庫..."
cd be_poker
if [ ! -f "poker_tracker.db" ]; then
    touch poker_tracker.db
    echo "✅ 資料庫文件已創建"
fi

cd ..

echo "✅ 開發環境設置完成！"
echo ""
echo "📋 下一步："
echo "1. 編輯 .devcontainer/.env 設置你的 OPENAI_API_KEY"
echo "2. 使用 ./start.sh 啟動服務"
echo "3. 在手機上運行 React Native 應用" 
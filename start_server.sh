#!/bin/bash

# 載入環境變數
source ~/.bash_profile

# 顯示當前API key (只顯示前幾個字符)
echo "🔑 Loading API Key: ${OPENAI_API_KEY:0:8}..."

# 停止現有服務器
echo "🛑 Stopping existing server..."
pkill -f "go run main.go" 2>/dev/null

# 等待進程停止
sleep 2

# 啟動新服務器
echo "🚀 Starting server with OpenAI API key..."
cd be_poker
OPENAI_API_KEY="$OPENAI_API_KEY" go run main.go &

echo "✅ Server started!"
echo "🔗 Backend URL: http://10.73.108.175:8080"

# 等待服務器啟動
sleep 3

# 測試API連接
echo "🧪 Testing API connection..."
curl -s -X POST http://10.73.108.175:8080/analyze -H "Content-Type: application/json" -d '{"handId":"test"}' | grep -q "Hand not found" && echo "✅ API endpoint working!" || echo "❌ API test failed - check logs" 
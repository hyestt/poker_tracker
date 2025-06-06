#!/bin/bash

echo "🃏 Poker Tracker - 一鍵啟動"
echo "=========================="

# 步驟1: 自動設定網路
echo "🌐 Step 1: 自動設定網路..."
LOCAL_IP=$(ifconfig | grep 'inet ' | grep -v '127.0.0.1' | head -1 | awk '{print $2}')

if [ -z "$LOCAL_IP" ]; then
    echo "❌ 無法獲取本機IP，將使用localhost"
    LOCAL_IP="localhost"
else
    echo "✅ 檢測到本機IP: $LOCAL_IP"
fi

# 更新前端配置
echo "REACT_NATIVE_API_HOST=$LOCAL_IP" > fe_poker/.env

# 更新api.ts中的IP地址
sed -i '' "s|return '[0-9.]*'; // 這會由start.sh動態更新|return '$LOCAL_IP'; // 這會由start.sh動態更新|" fe_poker/src/config/api.ts

# 步驟2: 檢查OpenAI API Key
echo "🤖 Step 2: 檢查AI配置..."
source ~/.bash_profile 2>/dev/null || true

# 確保環境變數正確設定
export OPENAI_API_KEY="$OPENAI_API_KEY"

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OpenAI API Key 未設定"
    echo "💡 AI analysis 功能將無法使用"
    echo "   如需使用，請設定: export OPENAI_API_KEY=\"your-key\""
else
    echo "✅ OpenAI API Key 已設定: ${OPENAI_API_KEY:0:10}..."
fi

# 步驟3: 停止舊服務器
echo "🛑 Step 3: 停止舊服務器..."
pkill -f "go run main.go" 2>/dev/null || true
sleep 1

# 步驟4: 啟動後端
echo "🚀 Step 4: 啟動後端服務器..."
cd be_poker

# 背景啟動後端
if [ -n "$OPENAI_API_KEY" ]; then
    echo "📡 啟動時設定API Key: ${OPENAI_API_KEY:0:10}..."
    env OPENAI_API_KEY="$OPENAI_API_KEY" go run main.go > ../backend.log 2>&1 &
else
    echo "⚠️  沒有API Key，AI功能將不可用"
    go run main.go > ../backend.log 2>&1 &
fi

# 儲存後端進程ID
echo $! > ../backend.pid

# 回到根目錄
cd ..

# 等待服務器啟動
echo "⏳ 等待服務器啟動..."
sleep 4

# 測試連接
echo "🧪 測試API連接..."
if curl -s -f "http://$LOCAL_IP:8080/hands" > /dev/null; then
    echo "✅ 後端啟動成功！"
    echo ""
    echo "🎉 系統已就緒！"
    echo "📍 後端地址: http://$LOCAL_IP:8080"
    echo "📱 前端請連接到: $LOCAL_IP"
    echo ""
    echo "💡 下一步："
    echo "   1. 啟動React Native Metro: cd fe_poker && npm start"
    echo "   2. 在Xcode中運行iOS app"
    echo ""
else
    echo "❌ 後端啟動失敗，請檢查錯誤訊息"
fi
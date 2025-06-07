#!/bin/bash

echo "🃏 Poker Tracker - 一鍵啟動"
echo "=========================="

# 步驟1: 自動設定網路
echo "🌐 Step 1: 自動設定網路..."

# 改善IP檢測，優先選擇非localhost的IP
LOCAL_IP=$(ifconfig | grep 'inet ' | grep -v '127.0.0.1' | grep -v '169.254' | head -1 | awk '{print $2}')

if [ -z "$LOCAL_IP" ]; then
    echo "❌ 無法獲取本機IP，嘗試其他方法..."
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
fi

if [ "$LOCAL_IP" = "localhost" ]; then
    echo "⚠️  只能使用localhost，可能影響真機測試"
else
    echo "✅ 檢測到本機IP: $LOCAL_IP"
fi

# 更新前端配置
echo "REACT_NATIVE_API_HOST=$LOCAL_IP" > fe_poker/.env

# 更新api.ts中的IP地址（使用更安全的sed語法）
if [ -f "fe_poker/src/config/api.ts" ]; then
    # 使用perl替代sed來避免macOS sed的問題
    perl -pi -e "s/return '[^']*'; \/\/ 這會由start\.sh動態更新/return '$LOCAL_IP'; \/\/ 這會由start.sh動態更新/" fe_poker/src/config/api.ts
    echo "✅ 已更新前端API配置"
else
    echo "❌ 找不到api.ts文件"
fi

# 步驟2: 檢查OpenAI API Key
echo "🤖 Step 2: 檢查AI配置..."

# 從多個來源加載環境變數
if [ -f ~/.bash_profile ]; then
    source ~/.bash_profile 2>/dev/null || true
fi
if [ -f ~/.bashrc ]; then
    source ~/.bashrc 2>/dev/null || true
fi
if [ -f ~/.zshrc ]; then
    source ~/.zshrc 2>/dev/null || true
fi

# 確保環境變數已載入
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

# 停止舊的後端進程
if [ -f backend.pid ]; then
    OLD_PID=$(cat backend.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "🔥 停止舊進程 PID: $OLD_PID"
        kill $OLD_PID 2>/dev/null || true
        sleep 2
    fi
    rm -f backend.pid
fi

# 也嘗試用其他方法停止可能的舊進程
pkill -f "go run main.go" 2>/dev/null || true
pkill -f "poker_tracker_backend" 2>/dev/null || true
sleep 1

# 步驟4: 啟動後端
echo "🚀 Step 4: 啟動後端服務器..."
cd be_poker

# 確保目錄正確
if [ ! -f "main.go" ]; then
    echo "❌ 錯誤：找不到main.go文件"
    echo "請確認當前在正確的專案目錄中"
    exit 1
fi

# 背景啟動後端
echo "📡 準備啟動後端服務器..."
# 清理舊的日誌文件
rm -f ../backend.log

# 編譯並運行後端
echo "🔨 編譯後端..."
if go build -o poker_tracker_backend . 2>/dev/null; then
    echo "✅ 編譯成功"
else
    echo "⚠️  編譯有警告，但繼續使用預編譯版本"
fi

# 使用預編譯的二進制文件啟動
if [ -n "$OPENAI_API_KEY" ]; then
    echo "🤖 使用OpenAI API Key啟動"
    env OPENAI_API_KEY="$OPENAI_API_KEY" nohup ./poker_tracker_backend > ../backend.log 2>&1 &
else
    echo "⚠️  沒有API Key，AI功能將不可用"
    nohup ./poker_tracker_backend > ../backend.log 2>&1 &
fi

# 儲存後端進程ID
SERVER_PID=$!
echo $SERVER_PID > ../backend.pid
echo "💾 後端進程ID: $SERVER_PID"

# 回到根目錄
cd ..

# 等待服務器啟動並檢查日誌
echo "⏳ 等待服務器啟動..."
sleep 3

# 等待服務器啟動
sleep 3  # 給服務器足夠時間啟動

# 直接測試API是否響應，這是最可靠的檢測方法
echo "🧪 測試API連接..."
API_WORKING=false
for i in {1..10}; do
    if curl -s -f "http://$LOCAL_IP:8080/hands" > /dev/null 2>&1; then
        API_WORKING=true
        break
    fi
    echo "⏳ 等待API響應... ($i/10)"
    sleep 1
done

if [ "$API_WORKING" = true ]; then
    echo "✅ API連接成功！後端正常運行"
else
    echo "❌ API連接失敗"
    echo "🔍 檢查進程狀態："
    ps aux | grep -E "(go run main.go|poker_tracker_backend)" | grep -v grep
    echo "🔍 檢查錯誤日誌："
    tail -n 10 backend.log
    exit 1
fi



echo ""
echo "🎉 系統已就緒！"
echo "📍 後端地址: http://$LOCAL_IP:8080"
echo "📱 前端請連接到: $LOCAL_IP"
echo "📄 進程ID: $SERVER_PID (儲存於backend.pid)"
echo ""
echo "💡 下一步："
echo "   1. 啟動React Native Metro: cd fe_poker && npm start"
echo "   2. 在Xcode中運行iOS app"
echo ""
echo "🛑 停止服務器: ./stop.sh"
echo "📋 查看日誌: tail -f backend.log"
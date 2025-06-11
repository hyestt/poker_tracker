#!/bin/bash

echo "🚂 Poker Tracker - Railway 部署助手"
echo "=================================="
echo ""

# 檢查 Git 狀態
echo "📋 檢查 Git 狀態..."
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  有未提交的變更，正在提交..."
    git add .
    git commit -m "Update for Railway deployment - $(date)"
    git push
else
    echo "✅ Git 狀態乾淨"
fi

echo ""
echo "🎯 下一步操作指南："
echo ""
echo "1. 前往 Railway.app"
echo "   👉 https://railway.app"
echo ""
echo "2. 使用 GitHub 帳號登入"
echo ""
echo "3. 點擊 'New Project' > 'Deploy from GitHub repo'"
echo ""
echo "4. 選擇 repository: poker_tracker"
echo ""
echo "5. Railway 會自動檢測到 Go 專案"
echo ""
echo "6. 在專案設定中配置："
echo "   📁 Root Directory: be_poker"
echo "   🔨 Build Command: go build -o main ."
echo "   ▶️  Start Command: ./main"
echo ""
echo "7. 設定環境變數 (Variables 頁面):"
echo "   DATABASE_URL=postgres://postgres.vdpscuywgjopwvcalgsn:Kyy850425%40@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
echo "   OPENAI_API_KEY=你的OpenAI金鑰"
echo ""
echo "8. 部署完成後會得到一個網址，例如："
echo "   https://poker-tracker-production.up.railway.app"
echo ""
echo "9. 更新前端 API_URL 指向新的 Railway 網址"
echo ""
echo "🎉 完成！你的 API 現在在雲端運行了！"
echo ""
echo "📖 詳細說明請參考: RAILWAY_DEPLOYMENT.md" 
#!/bin/bash

echo "🚨 開始緊急回滾 Sentry 整合..."

# 確保在專案根目錄
cd "$(dirname "$0")/.."

# 切換回主分支並重置到穩定版本
echo "📦 切換到穩定版本..."
git checkout main
git reset --hard v-stable-pre-sentry

# 重新安裝依賴
echo "📦 重新安裝依賴..."
npm install

# 清理快取
echo "🧹 清理快取..."
npx react-native start --reset-cache > /dev/null 2>&1 &
METRO_PID=$!
sleep 2
kill $METRO_PID 2>/dev/null || true

echo "✅ 回滾完成！"
echo "📋 請執行以下命令驗證回滾成功:"
echo "   npm run android"  
echo "   npm run ios"
echo "   npm start"

echo "⚠️  如果問題依然存在，請檢查 git 狀態: git status"
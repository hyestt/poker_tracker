#!/bin/bash
echo "🔄 恢復環境到備份狀態..."

# 恢復前端依賴
echo "📦 恢復前端依賴..."
cp fe-package.json ../fe_poker/package.json
cp fe-package-lock.json ../fe_poker/package-lock.json 2>/dev/null
cd ../fe_poker && npm install

# 恢復Go模組
echo "🐹 恢復Go模組..."
cd ../be_poker
cp ../environment-backup-*/go.mod .
cp ../environment-backup-*/go.sum .
go mod download

echo "✅ 環境恢復完成！"

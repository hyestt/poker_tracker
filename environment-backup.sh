#!/bin/bash

# 環境備份腳本 - Poker Tracker
# 創建時間: $(date)

echo "🔒 創建環境備份..."

# 創建備份目錄
BACKUP_DIR="environment-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 備份目錄: $BACKUP_DIR"

# 1. 備份package.json和package-lock.json
echo "📦 備份前端依賴..."
cp fe_poker/package.json "$BACKUP_DIR/fe-package.json"
cp fe_poker/package-lock.json "$BACKUP_DIR/fe-package-lock.json" 2>/dev/null || echo "No package-lock.json found"

# 2. 備份Go模組文件
echo "🐹 備份Go模組..."
cp be_poker/go.mod "$BACKUP_DIR/go.mod"
cp be_poker/go.sum "$BACKUP_DIR/go.sum"

# 3. 創建依賴列表
echo "📋 創建依賴快照..."
cd fe_poker && npm list --depth=0 > "../$BACKUP_DIR/npm-dependencies.txt" 2>/dev/null
cd ../be_poker && go list -m all > "../$BACKUP_DIR/go-dependencies.txt"
cd ..

# 4. 備份重要配置文件
echo "⚙️ 備份配置文件..."
cp fe_poker/src/config/api.ts "$BACKUP_DIR/api-config.ts" 2>/dev/null
cp be_poker/main.go "$BACKUP_DIR/main.go" 2>/dev/null
cp record.txt "$BACKUP_DIR/record.txt" 2>/dev/null

# 5. 創建恢復腳本
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
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
EOF

chmod +x "$BACKUP_DIR/restore.sh"

# 6. 創建環境信息
cat > "$BACKUP_DIR/environment-info.txt" << EOF
環境備份信息
============
備份時間: $(date)
Node版本: $(node --version 2>/dev/null || echo "未安裝")
npm版本: $(npm --version 2>/dev/null || echo "未安裝")
Go版本: $(go version 2>/dev/null || echo "未安裝")
系統: $(uname -a)

專案狀態:
- 後端服務: $(ps aux | grep "go run main.go" | grep -v grep | wc -l | tr -d ' ') 個進程運行中
- 資料庫: $(ls -la be_poker/*.db 2>/dev/null | wc -l | tr -d ' ') 個資料庫文件
- Git分支: $(git branch --show-current 2>/dev/null || echo "未知")
- Git狀態: $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') 個未提交變更

注意事項:
- 這個備份包含所有依賴版本信息
- 使用 restore.sh 可以恢復到此狀態
- 建議在安裝Firebase前先提交當前變更到Git
EOF

echo "✅ 環境備份完成！"
echo "📁 備份位置: $BACKUP_DIR"
echo "🔄 恢復指令: cd $BACKUP_DIR && ./restore.sh"
echo ""
echo "🚀 現在可以安全地安裝Firebase了！" 
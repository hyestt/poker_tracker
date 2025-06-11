# 🚂 Railway 部署指南

## 🎯 部署步驟

### 1. 推送到 GitHub
```bash
# 在專案根目錄
cd /Users/bytedance/Desktop/workspace/poker_tracker

# 初始化 Git (如果還沒有)
git init
git add .
git commit -m "Ready for Railway deployment with Supabase integration"

# 推送到 GitHub
git remote add origin https://github.com/YOUR_USERNAME/poker_tracker.git
git branch -M main
git push -u origin main
```

### 2. 連接到 Railway

1. 前往 [Railway.app](https://railway.app)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project"
4. 選擇 "Deploy from GitHub repo"
5. 選擇你的 `poker_tracker` repository
6. Railway 會自動檢測 Go 專案

### 3. 設定部署路徑

在 Railway 專案設定中：
- **Root Directory**: `be_poker`
- **Build Command**: `go build -o main .`
- **Start Command**: `./main`

### 4. 設定環境變數（重要！）

在 Railway 專案的 Variables 頁面添加：

```bash
DATABASE_URL=postgres://postgres.vdpscuywgjopwvcalgsn:Kyy850425%40@aws-0-us-west-1.pooler.supabase.com:6543/postgres
OPENAI_API_KEY=your_openai_api_key_here
```

### 5. 部署完成

Railway 會自動：
- 檢測 Go 專案
- 下載依賴
- 建置應用
- 部署到雲端
- 提供一個公開 URL (例如: `https://poker-tracker-production.up.railway.app`)

## 🔧 部署配置檔案說明

### `railway.json`
- Railway 專案配置
- 指定 Nixpacks 建置器
- 設定重啟政策

### `nixpacks.toml`
- 指定 Go 1.21 版本
- 自訂建置命令
- 設定啟動命令

### `.railwayignore`
- 忽略本地資料庫檔案
- 忽略建置產出
- 減少部署體積

## 📱 更新前端配置

部署完成後，更新前端的 API_URL：

```typescript
// fe_poker/src/config.ts 或相應配置檔案
const API_URL = 'https://your-railway-app-url.up.railway.app';
```

## 💰 費用說明

**Railway 免費額度：**
- 每月 500 小時運行時間
- 1GB RAM
- 1GB 磁碟空間
- 足夠小型專案使用

**超出後：**
- 按使用量計費
- 約 $0.01/小時

## 🔍 監控和日誌

Railway 提供：
- 即時日誌查看
- 資源使用監控
- 部署歷史
- 自動重啟

## 🚀 優勢

✅ **零設定部署** - 推送即部署  
✅ **自動 HTTPS** - 安全連接  
✅ **全球 CDN** - 快速存取  
✅ **自動重啟** - 高可用性  
✅ **GitHub 整合** - 持續部署  
✅ **免費開始** - 無成本測試  

## 🔄 持續部署

設定完成後，每次推送到 `main` branch，Railway 會自動：
1. 檢測變更
2. 重新建置
3. 自動部署
4. 零停機更新

**🎉 現在你的 Poker Tracker API 已經在雲端運行了！** 
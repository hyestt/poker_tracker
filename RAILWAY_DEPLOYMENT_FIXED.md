# 🚂 Railway 部署指南 (已修復)

## ❌ 原問題：`go: command not found`

**解決方案：** 改用 Docker 建置，更穩定可靠！

## ✅ 修復內容

1. **新增 Dockerfile** - 使用 Go 1.21 官方映像
2. **更新 railway.json** - 改用 DOCKERFILE 建置器
3. **優化建置流程** - 多階段建置，減少映像大小

## 🚀 **重新部署步驟**

### 1. 程式碼已更新並推送
✅ 修復已推送到 GitHub，Railway 會自動檢測到變更

### 2. Railway 重新部署
如果你的 Railway 專案已建立：
1. 進入你的 Railway 專案
2. 點擊 "Redeploy" 或等待自動部署
3. 現在會使用 Docker 建置，應該成功！

### 3. 全新部署 (如果需要)
如果要重新開始：

1. **前往** → https://railway.app
2. **新專案** → Deploy from GitHub repo
3. **選擇** → poker_tracker repository
4. **重要：設定 Root Directory** → `be_poker`
5. **建置設定** → Railway 會自動檢測 Dockerfile

### 4. 環境變數設定
```bash
DATABASE_URL=postgres://postgres.vdpscuywgjopwvcalgsn:Kyy850425%40@aws-0-us-west-1.pooler.supabase.com:6543/postgres
OPENAI_API_KEY=your_openai_api_key_here
```

## 🔧 技術細節

### Dockerfile 優化
- **多階段建置**：先建置，再運行
- **Alpine Linux**：輕量級執行環境
- **CA certificates**：支援 HTTPS 連接
- **自動端口檢測**：支援 Railway 的動態端口

### 建置過程
1. 使用 `golang:1.21-alpine` 建置
2. 下載 Go 依賴
3. 編譯為單一執行檔
4. 複製到 `alpine:latest` 運行
5. 總映像大小 < 20MB

## 💡 為什麼 Docker 更好？

❌ **Nixpacks 問題：**
- Go 版本檢測不穩定
- 環境變數設定複雜
- 建置失敗率較高

✅ **Docker 優勢：**
- 完全控制建置環境
- 一致的建置結果
- 更好的除錯能力
- Railway 原生支援

## 🎯 預期結果

部署成功後你將看到：
```
✅ Build completed successfully
✅ Deploy completed successfully
🌐 Your app is live at: https://poker-tracker-production.up.railway.app
```

## 🔍 檢查部署

部署完成後測試：
```bash
curl https://your-railway-url.up.railway.app/hands
```

應該返回 JSON 格式的手牌資料。

## 📱 更新前端

記得更新前端的 API_URL：
```typescript
const API_URL = 'https://your-railway-url.up.railway.app';
```

**🎉 現在應該可以成功部署了！** 
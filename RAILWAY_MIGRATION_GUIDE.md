# 🚂 Supabase 到 Railway PostgreSQL 完整遷移指南

## 📋 遷移概述

本指南將協助您將 Poker Tracker 應用從 Supabase 完整遷移到 Railway PostgreSQL，包括：
- 資料庫結構和資料遷移
- 後端 API 部署
- 前端配置更新

## 🎯 遷移目標

**從：** Supabase (雲端 PostgreSQL) + React Native 前端  
**到：** Railway PostgreSQL + Railway Go API + React Native 前端

## 📊 目前資料統計

- **Sessions:** 93 筆記錄
- **Hands:** 23 筆記錄
- **資料庫大小:** ~145 kB

## 🚀 遷移步驟

### 步驟 1: 準備 Railway 專案

1. **註冊 Railway 帳號**
   ```bash
   # 訪問 https://railway.app
   # 使用 GitHub 帳號註冊
   ```

2. **安裝 Railway CLI**
   ```bash
   npm install -g @railway/cli
   # 或
   brew install railway
   ```

3. **登入 Railway**
   ```bash
   railway login
   ```

4. **創建新專案並添加 PostgreSQL**
   ```bash
   railway init
   railway add --database postgresql
   ```

5. **獲取 Railway PostgreSQL 連接字串**
   ```bash
   railway variables
   # 複製 DATABASE_URL 的值
   ```

### 步驟 2: 執行資料庫遷移

1. **設定環境變數**
   ```bash
   export DATABASE_URL="postgresql://postgres:seUSLaxtymEhQHEgSZDdOhpfiPNwelQq@postgres.railway.internal:5432/railway"
   ```

2. **執行遷移腳本**
   ```bash
   ./migrate_to_railway.sh
   ```

   腳本將自動執行：
   - ✅ 匯出 Supabase 資料庫結構
   - ✅ 匯出 Supabase 資料 (93 sessions + 23 hands)
   - ✅ 清理並準備 Railway 專用 SQL
   - ✅ 測試 Railway 資料庫連接
   - ✅ 創建 Railway 表結構
   - ✅ 匯入資料到 Railway
   - ✅ 驗證遷移結果
   - ✅ 更新後端配置

### 步驟 3: 部署後端到 Railway

1. **執行部署腳本**
   ```bash
   ./deploy_to_railway.sh
   ```

2. **設定環境變數**
   ```bash
   # 在 Railway 控制台或使用 CLI
   railway variables set OPENAI_API_KEY="your_openai_key"
   railway variables set PORT=8080
   ```

3. **獲取部署 URL**
   ```bash
   railway domain
   # 例如: https://poker-tracker-production.up.railway.app
   ```

### 步驟 4: 更新前端配置

1. **創建新的 API 配置**
   ```typescript
   // fe_poker/src/config/railway.ts
   export const API_CONFIG = {
     BASE_URL: 'https://your-railway-app.railway.app',
     ENDPOINTS: {
       SESSIONS: '/sessions',
       HANDS: '/hands',
       ANALYZE: '/analyze',
     },
     TIMEOUT: 10000,
   };
   ```

2. **更新 sessionStore.ts**
   ```typescript
   // 替換 Supabase 客戶端調用為 HTTP API 調用
   import { API_CONFIG } from '../config/railway';
   
   // 範例: 獲取 sessions
   const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SESSIONS}`);
   const sessions = await response.json();
   ```

3. **移除 Supabase 依賴**
   ```bash
   cd fe_poker
   npm uninstall @supabase/supabase-js react-native-url-polyfill
   ```

### 步驟 5: 測試完整功能

1. **測試 API 連接**
   ```bash
   curl https://your-railway-app.railway.app/sessions
   curl https://your-railway-app.railway.app/hands
   ```

2. **測試前端功能**
   - 啟動 React Native 應用
   - 測試 session 創建和編輯
   - 測試 hand 記錄和編輯
   - 測試 AI 分析功能
   - 測試收藏功能

## 📁 遷移產生的檔案

遷移完成後會產生以下檔案：

```
railway_migration_YYYYMMDD_HHMMSS/
├── schema.sql                 # 原始 Supabase 結構
├── data.sql                   # 原始 Supabase 資料
├── railway_schema.sql         # Railway 專用結構
├── railway_data.sql           # Railway 專用資料
├── railway_backup.sql         # Railway 原有資料備份
├── db.go.backup              # 原始後端配置備份
└── frontend_update_guide.md   # 前端更新指南
```

## 🔧 技術細節

### 資料庫結構對應

| Supabase | Railway | 說明 |
|----------|---------|------|
| sessions 表 | sessions 表 | 完全相同結構 |
| hands 表 | hands 表 | 完全相同結構 |
| RLS 政策 | 移除 | Railway 使用 API 層控制 |
| 觸發器 | 移除 | 使用應用層邏輯 |

### API 架構變更

| 功能 | Supabase | Railway |
|------|----------|---------|
| 資料庫連接 | 直接客戶端 | HTTP API |
| 即時更新 | WebSocket | 輪詢或 WebSocket |
| 認證 | Supabase Auth | 自定義或第三方 |
| 檔案儲存 | Supabase Storage | Railway + 第三方 |

## ⚠️ 注意事項

### 遷移前檢查清單

- [ ] 確認 Railway 帳號已設定
- [ ] 確認 PostgreSQL 客戶端已安裝 (`psql`)
- [ ] 確認 Railway CLI 已安裝並登入
- [ ] 備份現有 Supabase 資料
- [ ] 確認 OpenAI API Key 可用

### 遷移後驗證清單

- [ ] Railway 資料庫包含所有 sessions (93 筆)
- [ ] Railway 資料庫包含所有 hands (23 筆)
- [ ] 後端 API 成功部署並可訪問
- [ ] 前端可以正常連接 Railway API
- [ ] 所有功能正常運作 (CRUD, AI 分析, 收藏)

## 🆘 故障排除

### 常見問題

1. **`psql: command not found`**
   ```bash
   brew install postgresql
   ```

2. **Railway 連接失敗**
   - 檢查 DATABASE_URL 格式是否正確
   - 確認 Railway PostgreSQL 服務已啟動

3. **部署失敗**
   - 檢查 Dockerfile 是否存在
   - 檢查 go.mod 依賴是否完整
   - 查看 Railway 控制台錯誤日誌

4. **前端連接失敗**
   - 確認 Railway API URL 正確
   - 檢查 CORS 設定
   - 確認 API endpoints 正常回應

### 回滾計劃

如果遷移失敗，可以快速回滾：

1. **恢復後端配置**
   ```bash
   cp railway_migration_*/db.go.backup be_poker/db/db.go
   ```

2. **恢復前端配置**
   ```bash
   # 恢復 Supabase 配置
   git checkout fe_poker/src/config/supabase.ts
   git checkout fe_poker/src/viewmodels/sessionStore.ts
   ```

3. **重新安裝 Supabase 依賴**
   ```bash
   cd fe_poker
   npm install @supabase/supabase-js react-native-url-polyfill
   ```

## 🎉 遷移完成後的優勢

### 效能提升
- ✅ 更快的 API 回應時間
- ✅ 更好的資料庫查詢控制
- ✅ 自定義快取策略

### 成本控制
- ✅ Railway 免費額度更慷慨
- ✅ 可預測的定價模式
- ✅ 無 Supabase 限制

### 開發體驗
- ✅ 完整的後端控制權
- ✅ 更簡單的部署流程
- ✅ 更好的錯誤處理和日誌

## 📞 支援

如果遇到問題，請檢查：
1. 遷移腳本產生的日誌檔案
2. Railway 控制台的部署日誌
3. 前端開發者工具的網路請求

---

**🚀 準備好開始遷移了嗎？執行 `./migrate_to_railway.sh` 開始！** 
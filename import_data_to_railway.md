# Supabase 到 Railway 資料遷移指南

## 步驟概述

1. 從Supabase導出資料為SQL插入語句
2. 在Railway PostgreSQL中初始化資料庫結構
3. 將導出的INSERT語句導入Railway
4. 驗證資料完整性

## 詳細步驟

### 步驟1: 導出Supabase資料

1. 登入Supabase儀表板 (https://app.supabase.com)
2. 選擇你的專案: `vdpscuywgjopwvcalgsn`
3. 點擊「SQL Editor」
4. 複製貼上 `export_supabase_data.sql` 中的SQL並執行
5. 將結果複製到 `supabase_data.sql` 檔案中

### 步驟2: 初始化Railway資料庫結構

1. 登入Railway儀表板
2. 進入你的PostgreSQL服務
3. 點擊「Data」標籤
4. 執行以下SQL建立資料表:

```sql
-- Sessions 表格
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    buy_in INTEGER NOT NULL,
    cash_out INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hands 表格
CREATE TABLE IF NOT EXISTS hands (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    position TEXT NOT NULL,
    hole_cards TEXT NOT NULL,
    action TEXT NOT NULL,
    amount INTEGER NOT NULL,
    result INTEGER NOT NULL,
    villains TEXT DEFAULT '[]',
    board TEXT DEFAULT '',
    note TEXT DEFAULT '',
    date TEXT NOT NULL,
    analysis TEXT DEFAULT '',
    analysis_date TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- 建立索引以提升效能
CREATE INDEX IF NOT EXISTS idx_hands_session_id ON hands(session_id);
CREATE INDEX IF NOT EXISTS idx_hands_date ON hands(date);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
```

### 步驟3: 導入資料到Railway

1. 返回Railway PostgreSQL的「Data」標籤
2. 貼上並執行 `supabase_data.sql` 中的INSERT語句

### 步驟4: 驗證資料

執行以下SQL檢查資料是否成功導入:

```sql
-- 檢查sessions表數據
SELECT COUNT(*) AS sessions_count FROM sessions;

-- 檢查hands表數據
SELECT COUNT(*) AS hands_count FROM hands;
```

## 驗證API連接

遷移完成後，使用 `test_railway_connection.js` 測試:

```bash
node test_railway_connection.js
```

## 遷移後清單

- [ ] 確認所有sessions都已導入
- [ ] 確認所有hands都已導入
- [ ] 確認Railway API能正常存取資料
- [ ] 更新前端配置指向Railway
- [ ] 備份Supabase資料

## 常見問題

1. **主鍵衝突**: 使用`ON CONFLICT (id) DO NOTHING`處理
2. **外鍵約束**: 先導入sessions再導入hands
3. **連接問題**: 確認環境變數設置正確 
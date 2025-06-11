# 🎯 Supabase 設置指南

## 第一步：建立Supabase專案

1. 前往 [https://supabase.com](https://supabase.com)
2. 註冊/登入帳號
3. 點擊「New Project」
4. 輸入專案名稱：`poker-tracker`
5. 選擇資料庫區域（建議選擇離你最近的）
6. 設定資料庫密碼（請記住）
7. 等待專案建立完成（約2分鐘）

## 第二步：建立資料庫表格

### 1. 進入SQL編輯器
- 在Supabase Dashboard中，點擊左側選單的「SQL Editor」
- 點擊「New query」

### 2. 執行以下SQL語句建立表格：

```sql
-- 建立Sessions表格
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  date TEXT NOT NULL,
  small_blind INTEGER NOT NULL,
  big_blind INTEGER NOT NULL,
  currency TEXT NOT NULL,
  effective_stack INTEGER NOT NULL,
  table_size INTEGER NOT NULL,
  tag TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 建立Hands表格
CREATE TABLE hands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  position TEXT DEFAULT '',
  hole_cards TEXT DEFAULT '',
  details TEXT DEFAULT '',
  result_amount REAL DEFAULT 0,
  analysis TEXT DEFAULT '',
  analysis_date TIMESTAMP,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 建立索引提升查詢效能
CREATE INDEX idx_hands_session_id ON hands(session_id);
CREATE INDEX idx_hands_created_at ON hands(created_at);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_hands_is_favorite ON hands(is_favorite);

-- 建立updated_at自動更新觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hands_updated_at 
    BEFORE UPDATE ON hands 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. 點擊「Run」執行SQL

## 第三步：獲取API密鑰

1. 在Supabase Dashboard中，點擊左側選單的「Settings」
2. 點擊「API」
3. 複製以下資訊：
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsI...` (很長的字串)

## 第四步：配置前端應用

1. 開啟 `fe_poker/src/config/supabase.ts`
2. 替換以下內容：

```typescript
const supabaseUrl = 'https://your-project-ref.supabase.co' // 替換為你的Project URL
const supabaseAnonKey = 'your-anon-key' // 替換為你的anon public key
```

## 第五步：設置OpenAI API Key

1. 開啟 `fe_poker/src/services/openaiService.ts`
2. 替換以下內容：

```typescript
const OPENAI_API_KEY = 'sk-your-openai-api-key-here' // 替換為你的OpenAI API Key
```

## 第六步：測試連線

1. 重新啟動React Native應用
2. 檢查Metro terminal是否有任何錯誤
3. 嘗試建立新的場次和手牌記錄

## 🔒 Row Level Security (RLS) 設置（可選）

如果你想要更安全的資料存取控制：

```sql
-- 啟用RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hands ENABLE ROW LEVEL SECURITY;

-- 建立允許所有操作的策略（適用於單用戶應用）
CREATE POLICY "Allow all operations" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON hands FOR ALL USING (true);
```

## 📊 確認設置成功

在Supabase Dashboard的「Table Editor」中，你應該可以看到：
- `sessions` 表格（0 rows）
- `hands` 表格（0 rows）

當你在應用中建立第一個場次時，資料會出現在這些表格中。

## 🚨 常見問題

### 1. 連線錯誤
- 檢查Project URL和API Key是否正確
- 確認網路連線正常

### 2. 插入資料失敗
- 檢查資料表格是否正確建立
- 查看Supabase Dashboard的「Logs」獲取錯誤詳情

### 3. OpenAI分析失敗
- 確認OpenAI API Key設置正確
- 檢查API額度是否足夠

## 💰 成本估算

**Supabase免費額度（每月）：**
- 500MB資料庫空間
- 50MB檔案儲存
- 2GB資料傳輸
- 50,000次資料庫讀取

**估算使用量（一般用戶）：**
- 一年1000手牌記錄 ≈ 5MB
- 每月API調用 ≈ 5,000次
- 完全在免費額度內！

**OpenAI成本：**
- 每次手牌分析約 $0.0003-0.0008
- 月使用100次分析 ≈ $0.05-0.08 
# OpenAI 分析功能設定指南

## 環境變數設定

### 1. 獲取 OpenAI API Key
1. 前往 [OpenAI Platform](https://platform.openai.com)
2. 登入或註冊帳號
3. 前往 API Keys 頁面
4. 點擊 "Create new secret key"
5. 複製生成的 API key

### 2. 設定環境變數

#### macOS/Linux (Terminal)
```bash
export OPENAI_API_KEY="your-api-key-here"
```

#### 永久設定 (推薦)
將以下行加入 `~/.zshrc` 或 `~/.bash_profile`:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

然後重新加載:
```bash
source ~/.zshrc  # 或 source ~/.bash_profile
```

### 3. 啟動後端服務器
```bash
cd poker_tracker_backend
go run main.go
```

## 功能說明

### AI 分析功能
- **分析按鈕**：在 HomeScreen 和 HistoryScreen 的每個手牌記錄旁
- **分析內容**：
  1. 技術分析：手牌打法是否正確
  2. 決策評估：關鍵決策點的優劣
  3. 改進建議：如何改善打法
  4. 學習重點：從這手牌學到什麼

### 使用模型
- **GPT-4o-mini**：經濟實惠的選擇，適合大量分析
- **成本控制**：每次分析限制 500 tokens

### 分析結果
- 分析結果會保存在資料庫中
- 已分析的手牌會顯示 "✨ 已分析" 標示
- 可重複分析同一手牌以獲得新的見解

## 故障排除

### 常見錯誤
1. **"OpenAI service not available"** - 檢查 API key 是否正確設定
2. **"Failed to analyze hand"** - 檢查網路連線和 API 額度
3. **分析按鈕沒有反應** - 確認後端服務器正在運行

### 檢查設定
```bash
echo $OPENAI_API_KEY  # 確認環境變數已設定
```

## 成本估算
- GPT-4o-mini: ~$0.0015 per 1K tokens
- 每次分析約 200-500 tokens
- 估計每次分析成本: $0.0003-0.0008 (約 0.01-0.02 台幣) 
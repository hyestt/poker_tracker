# Model Testing 資料夾

這個資料夾包含用於測試不同 AI 模型的 Python 腳本和相關檔案。

## 📁 檔案結構

```
model_testing/
├── README.md                    # 本說明檔案
├── requirements.txt             # Python 依賴套件
├── claude_env/                  # Python 虛擬環境
├── claude_api_client.py         # Claude API 客戶端 (原版)
├── ai_api_client.py            # 多模型 API 客戶端 (Claude + OpenAI)
└── CLAUDE_API_USAGE.md         # 詳細使用說明
```

## 🚀 快速開始

### 1. 啟動虛擬環境
```bash
cd model_testing
source claude_env/bin/activate
```

### 2. 使用 Claude Sonnet 4 分析手牌
```bash
python3 ai_api_client.py --use-hand-history --language "Chinese" --model "claude-sonnet-4-20250514"
```

### 3. 使用 OpenAI GPT-4o 分析手牌
```bash
python3 ai_api_client.py --use-hand-history --language "Chinese" --model "gpt-4o"
```

## 📋 手牌輸入

將您要分析的手牌歷史貼到專案根目錄的 `hand_history.txt` 檔案中，然後使用 `--use-hand-history` 參數。

## 🔧 支援的模型

### Claude 模型
- `claude-sonnet-4-20250514` (預設)
- `claude-3-5-sonnet-20241022`
- `claude-3-5-haiku-20241022`

### OpenAI 模型  
- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4-turbo`

## 🔑 環境變數

確保設定以下 API 金鑰：
```bash
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
export OPENAI_API_KEY="sk-proj-your-key-here"
```

## 📊 輸出格式

所有模型都會產生相同格式的 JSON 分析結果，包含：
- 整體評分和總結
- 各街道 (preflop, flop, turn, river) 的詳細分析
- GTO 建議頻率
- 評分和改進建議

## 🎯 用途

這個資料夾主要用於：
- 測試不同 AI 模型的分析品質
- 比較 Claude 和 OpenAI 的分析結果
- 驗證與後端 Go 服務的一致性
- 開發和調試 AI 分析功能

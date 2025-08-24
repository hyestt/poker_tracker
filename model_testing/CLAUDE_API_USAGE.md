# Claude 4 API Python 客戶端使用指南

這個 Python script 可以讀取專案中的 `system_prompt.txt` 和 `user_prompt.json` 檔案，並呼叫 Claude 4 API 來產生撲克手牌分析。

## 安裝依賴

```bash
pip install -r requirements.txt
```

或直接安裝：

```bash
pip install anthropic
```

## 環境設定

設定 Claude API 金鑰：

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-your-api-key-here"
```

## 基本使用

### 1. 簡單執行（使用預設值）

```bash
python claude_api_client.py
```

這會使用預設的手牌設定：
- Hero 手牌: AsKs
- 位置: BTN (Button)
- Flop: AhKdQc
- Turn: 7s
- River: 2h
- 語言: English

### 2. 使用 hand_history.txt 檔案（推薦）

```bash
python claude_api_client.py --use-hand-history --language "Chinese"
```

將您的手牌歷史直接貼到 `hand_history.txt` 檔案中，script 會自動讀取並分析。支援 PokerStars、888poker 等常見格式。

### 3. 自定義手牌分析

```bash
python claude_api_client.py \
  --hero-cards "AhAd" \
  --position "UTG" \
  --flop "KsQcJh" \
  --turn "10d" \
  --river "9s" \
  --language "Chinese" \
  --hand-details "Hero raised preflop, got called by BB. Flop came KQJ rainbow."
```

### 4. 使用不同的 Claude 模型

```bash
python claude_api_client.py \
  --model "claude-3-5-sonnet-20241022" \
  --hero-cards "KdKh"
```

### 5. 儲存結果到檔案

```bash
python claude_api_client.py \
  --output "analysis_result.json" \
  --hero-cards "QsQd" \
  --language "Chinese"
```

## 參數說明

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `--model` | claude-3-5-sonnet-20241022 | Claude 模型名稱 |
| `--language` | English | 分析語言 |
| `--hand-details` | Standard poker hand analysis request | 手牌詳情描述 |
| `--hero-cards` | AsKs | Hero 的底牌 |
| `--position` | BTN | Hero 的位置 |
| `--flop` | AhKdQc | Flop 三張牌 |
| `--turn` | 7s | Turn 牌 |
| `--river` | 2h | River 牌 |
| `--output` | (無) | 輸出檔案路徑 |
| `--use-hand-history` | false | 使用 hand_history.txt 檔案 |

## 可用的 Claude 模型

- `claude-sonnet-4-20250514` (預設，與後端 Go 服務相同)
- `claude-3-5-sonnet-20241022`
- `claude-3-5-haiku-20241022`
- `claude-3-opus-20240229`

## 程式碼使用範例

```python
from claude_api_client import ClaudeAPIClient

# 建立客戶端
client = ClaudeAPIClient()

# 方法 1: 使用 hand_history.txt 檔案
response = client.analyze_hand(
    language="Chinese",
    use_hand_history=True
)

# 方法 2: 直接指定手牌參數
response = client.analyze_hand(
    language="Chinese",
    hand_details="Hero在UTG位置用AK開局加注，BB跟注。Flop來了AKQ彩虹面。",
    HERO_HOLE_CARDS="AhKd",
    HERO_POSITION="UTG",
    FLOP_CARDS="AsKcQh",
    TURN_CARD="7d",
    RIVER_CARD="2s"
)

print(response)
```

## 輸出格式

Claude 會返回 JSON 格式的分析結果，包含：

- `summary`: 整體評分和總結
- `preflop`: Preflop 階段分析
- `flop`: Flop 階段分析  
- `turn`: Turn 階段分析
- `river`: River 階段分析

每個階段包含：
- `player_action`: 玩家行動描述
- `recommendation`: GTO 建議
- `frequencies`: 各種行動的頻率百分比
- `rating`: 評分 (1-5 星)
- `summary`: 該階段總結

## 錯誤處理

Script 會處理以下常見錯誤：

1. **API 金鑰未設定**: 請確保設定 `ANTHROPIC_API_KEY` 環境變數
2. **Prompt 檔案不存在**: 確保 `be_poker/prompts/` 目錄下有 `system_prompt_2.txt` 和 `user_prompt_2.json` 檔案
3. **API 呼叫失敗**: 檢查網路連接和 API 金鑰有效性
4. **依賴套件未安裝**: 執行 `pip install anthropic`

## 注意事項

1. 確保您有有效的 Claude API 金鑰和足夠的 API 額度
2. 大型分析可能需要較長時間，請耐心等待
3. API 回應受到 token 限制 (預設 1800 tokens)
4. 建議在正式使用前先測試基本功能

## 疑難排解

### 問題：找不到 prompt 檔案
**解決方案**: 確保在專案根目錄執行 script，且 `be_poker/prompts/` 目錄存在

### 問題：API 金鑰錯誤
**解決方案**: 檢查環境變數設定，確保金鑰格式正確 (`sk-ant-api03-...`)

### 問題：網路連接超時
**解決方案**: 檢查網路連接，或稍後重試

### 問題：回應格式不正確
**解決方案**: 檢查 system_prompt.txt 中的 JSON 格式要求是否正確

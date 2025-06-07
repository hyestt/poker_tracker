# Poker Tracker Development Container

這個 devcontainer 配置提供了一個標準化的開發環境，包含所有必要的工具和依賴。

## 功能特色

- **Go 1.21** - 後端開發環境
- **Node.js 20** - React Native 開發環境  
- **預配置的 VS Code 擴展** - Go、TypeScript、Tailwind CSS 等
- **環境變數管理** - 安全的 API 密鑰存儲
- **端口轉發** - 自動轉發開發服務端口
- **自動設置** - 一鍵安裝所有依賴

## 快速開始

### 1. 使用 VS Code Dev Containers

1. 安裝 VS Code 和 "Dev Containers" 擴展
2. 打開專案資料夾
3. 按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows/Linux)
4. 選擇 "Dev Containers: Reopen in Container"
5. 等待容器建置完成

### 2. 設置環境變數

1. 容器啟動後，編輯 `.devcontainer/.env` 文件
2. 設置你的 OpenAI API 密鑰：
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 3. 啟動服務

```bash
# 使用一鍵啟動腳本
./start.sh

# 或手動啟動
cd be_poker && go run main.go &
cd fe_poker && npm start
```

## 環境變數配置

環境變數存儲在 `.devcontainer/.env` 文件中：

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Development Environment
NODE_ENV=development
CGO_ENABLED=1

# Network Configuration  
API_HOST=localhost
API_PORT=8080

# Database Configuration
DB_PATH=poker_tracker.db

# React Native Configuration
REACT_NATIVE_API_HOST=localhost
```

## 端口說明

- **8080** - Go 後端 API 服務
- **3000** - React Native Metro 開發服務器
- **8081** - Metro Bundler

## 自動安裝的工具

- Go 1.21 with CGO support
- Node.js 20 with npm
- React Native CLI
- Git
- Docker (Docker-in-Docker)

## VS Code 擴展

自動安裝的擴展包括：
- Go 語言支援
- TypeScript 支援  
- Tailwind CSS 智能提示
- Prettier 代碼格式化
- JSON 支援

## 故障排除

### 環境變數未載入
確保 `.devcontainer/.env` 文件存在且格式正確。

### Go 編譯錯誤
檢查 CGO_ENABLED=1 是否正確設置。

### React Native 連接問題
確保手機和開發容器在同一網路中。

## 檔案結構

```
.devcontainer/
├── devcontainer.json      # 主要配置文件
├── setup.sh              # 自動設置腳本
├── environment.template   # 環境變數模板
└── README.md             # 說明文件
``` 
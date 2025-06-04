# 撲克追蹤器 (Poker Tracker)

一個現代化的撲克遊戲追蹤應用程式，幫助玩家記錄和分析自己的撲克遊戲數據。

## 功能特點

- 記錄撲克遊戲場次，包括買入金額、取出金額、地點等資訊
- 追蹤每個手牌的詳細動作記錄
- 統計分析功能，查看總獲利、平均獲利和勝率
- 美觀直觀的使用者界面
- 支持手機和桌面設備

## 技術架構

### 前端
- React (TypeScript)
- Material UI 設計框架
- React Router 處理路由
- Axios 處理 API 請求

### 後端
- Golang
- Gin Web 框架
- GORM 資料庫 ORM
- MySQL 資料庫

## 快速開始

### 前端

```bash
# 進入前端目錄
cd frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm start
```

訪問 http://localhost:3000 查看應用。

### 後端

```bash
# 進入後端目錄
cd backend

# 運行後端伺服器
go run main.go
```

後端 API 將在 http://localhost:8080 啟動。

## 資料庫設置

在運行後端之前，請確保 MySQL 資料庫已啟動，並且創建了名為 `poker_tracker` 的資料庫。

預設的資料庫連接設置為：
- 使用者: root
- 密碼: password
- 主機: localhost
- 端口: 3306
- 資料庫: poker_tracker

您可以透過環境變數修改這些設置：
```bash
export DB_USER=your_user
export DB_PASSWORD=your_password
export DB_HOST=your_host
export DB_PORT=your_port
export DB_NAME=your_db_name
```

## 項目結構

```
├── backend/                # 後端代碼
│   ├── controllers/        # 控制器
│   ├── models/             # 資料模型
│   ├── routes/             # 路由設定
│   └── main.go             # 主程序入口
└── frontend/               # 前端代碼
    ├── public/             # 靜態資源
    └── src/                # 源代碼
        ├── components/     # UI 組件
        ├── models/         # 類型定義
        ├── services/       # API 服務
        ├── utils/          # 工具函數
        └── views/          # 頁面視圖
```

## 截圖

![應用截圖](poker_tracker_ui.png)

## 許可證

MIT 
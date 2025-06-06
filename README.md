# Poker Tracker 專案說明

## 專案結構

```
poker_tracker/
├── poker_tracker_app/         # 前端 React Native App (MVVM 架構)
│   ├── src/
│   │   ├── screens/           # View 層，所有畫面元件
│   │   ├── viewmodels/        # ViewModel 層，狀態與邏輯
│   │   ├── components/        # 可重用 UI 元件
│   │   └── models.ts          # Model 層，資料結構定義
│   ├── App.tsx                # App 入口，導航設定
│   ├── theme.ts               # 主題與樣式
│   └── ...                    # 其他 RN 專案檔案
├── poker_tracker_backend/     # 後端 Golang API
│   ├── main.go                # 伺服器啟動入口
│   ├── routes/                # API 路由
│   ├── handlers/              # 各功能處理邏輯
│   ├── models/                # 資料結構
│   └── db/                    # 資料庫連線
└── ...
```

## 架構說明

- **前端 (poker_tracker_app)**
  - 採用 MVVM 架構，`screens` 為 View，`viewmodels` 管理狀態與商業邏輯，`models.ts` 定義資料結構。
  - 使用 React Native + TypeScript，UI 風格集中於 `theme.ts`。
  - 主要畫面：首頁(Home)、新增場次(NewSession)、紀錄手牌(RecordHand)、歷史紀錄(History)、統計(Stats)。
  - 狀態管理用 `zustand`，所有 session/hand/stats 操作集中於 `sessionStore.ts`。

- **後端 (poker_tracker_backend)**
  - 使用 Golang，RESTful API 設計。
  - `main.go` 啟動伺服器，`routes` 註冊 API 路由，`handlers` 處理請求，`models` 定義資料結構，`db` 管理資料庫連線。
  - 主要 API：/sessions, /session, /hands, /hand, /stats。

## 使用方法

### 前端

1. 進入 `poker_tracker_app` 目錄
2. 安裝依賴
   ```bash
   npm install
   # 或
   yarn
   ```
3. 啟動 Metro
   ```bash
   npm start
   # 或
   yarn start
   ```
4. 執行 App
   - Android: `npm run android` 或 `yarn android`
   - iOS: `npm run ios` 或 `yarn ios` (首次需先 `bundle install` + `bundle exec pod install`)

### 後端

1. 進入 `poker_tracker_backend` 目錄
2. 啟動伺服器
   ```bash
   go run main.go
   ```
   預設監聽在 `:8080`，API 可供前端呼叫。

## 主要功能

- 新增/管理撲克場次
- 紀錄每一手牌結果
- 歷史紀錄查詢與排序
- 盈虧統計（總盈虧、勝率、分場地/盲注統計）

## MVVM 架構說明

- **Model**：`src/models.ts` 定義 Session/Hand/Stats 結構
- **ViewModel**：`src/viewmodels/sessionStore.ts` 管理所有資料與邏輯
- **View**：`src/screens/` 下各畫面元件，僅負責 UI 呈現與事件觸發 
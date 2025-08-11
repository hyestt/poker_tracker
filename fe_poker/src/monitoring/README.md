# Poker Tracker 監控系統

## 概述

這是一個純觀察者模式的監控系統，遵循以下核心原則：
- **只觀察，不改變**：絕不修改任何業務邏輯或數據流
- **安全失敗**：監控系統的任何錯誤都不會影響主要功能
- **可完全移除**：可以刪除整個 monitoring 目錄而不影響 app 運行
- **功能開關控制**：可通過環境變數即時啟用/關閉監控

## 架構設計

### 核心組件

1. **SentryMonitor.ts** - Sentry 監控服務核心
2. **storeMonitor.ts** - Zustand Store 狀態變化監控
3. **databaseMonitor.ts** - 資料庫操作監控包裝器
4. **functionWrappers.ts** - 函數監控裝飾器
5. **config.ts** - 監控配置和功能開關
6. **initializeMonitoring.ts** - 安全初始化流程

### 檔案結構
```
src/monitoring/
├── index.ts                  # 主要導出
├── SentryMonitor.ts          # Sentry 監控核心
├── storeMonitor.ts           # Store 狀態監控
├── databaseMonitor.ts        # 資料庫監控
├── functionWrappers.ts       # 函數包裝器
├── config.ts                 # 配置管理
├── initializeMonitoring.ts   # 初始化邏輯
└── README.md                 # 本文檔
```

## 使用方式

### 1. 在 App.tsx 中初始化（可選）

```typescript
import { initializeMonitoring } from './src/monitoring';

export default function App() {
  useEffect(() => {
    // 初始化監控（失敗不影響 app 運行）
    initializeMonitoring('YOUR_SENTRY_DSN_HERE');
  }, []);
  
  // 原始 app 邏輯完全不變
  return (
    <NavigationContainer>
      {/* 原始 JSX */}
    </NavigationContainer>
  );
}
```

### 2. 環境變數控制

```bash
# 完全關閉監控
export MONITORING_ENABLED=false

# 緊急關閉（運行時）
export EMERGENCY_DISABLE_MONITORING=true

# 啟用調試模式
export MONITORING_DEBUG=true

# 關閉特定功能
export DISABLE_SENTRY_ERRORS=true
export DISABLE_SENTRY_PERFORMANCE=true
```

### 3. 現有代碼中的監控（已實現）

監控代碼已安全地添加到現有的 try-catch 區塊中：

```typescript
// sessionStore.ts 中的例子
try {
  // 監控：開始獲取會話數據
  monitor.safeTrack('fetch_sessions_started');
  
  // 原始業務邏輯完全不變
  const sessions = await DatabaseService.getAllSessions();
  set({ sessions });
  
  // 監控：記錄成功
  monitor.safeTrack('fetch_sessions_success', { count: sessions.length });
} catch (error) {
  // 監控：記錄錯誤但不影響錯誤處理
  monitor.safeCapture(error, { operation: 'fetch_sessions' });
  
  // 原始錯誤處理邏輯完全不變
  console.error('Error fetching sessions:', error);
  // ... 原始錯誤處理
}
```

## 監控覆蓋範圍

### 已監控的關鍵操作

1. **應用初始化**
   - `app_initialization_started`
   - `app_initialization_completed`
   - `app_mode_initialized`

2. **會話管理**
   - `fetch_sessions_started/success`
   - `add_session_started/success`
   - `fetch_sessions_fallback_to_cache`

3. **Store 狀態變化**
   - `sessions_added/removed`
   - `hands_added/removed`
   - `storage_mode_changed`
   - `stats_profit_changed`

4. **資料庫操作**（透過包裝器可用）
   - 所有 DatabaseService 方法
   - 自動性能監控
   - 錯誤追蹤

## 安全特性

### 1. 故障隔離
```typescript
// 所有監控操作都包裝在安全函數中
monitor.safeTrack('event', data);  // 失敗不影響主功能
monitor.safeCapture(error);        // 失敗不影響錯誤處理
```

### 2. 功能開關
```typescript
// 運行時檢查
if (!isMonitoringEnabled()) {
  return; // 直接退出，不執行監控代碼
}
```

### 3. 緊急關閉
```bash
# 環境變數可即時關閉所有監控
export EMERGENCY_DISABLE_MONITORING=true
```

## 性能影響

- **最小化開銷**：監控代碼執行時間 < 1ms
- **記憶體安全**：不記錄敏感數據或大型對象
- **網路友好**：批次處理事件，避免頻繁網路請求

## 調試和測試

### 獲取監控狀態
```typescript
import { getMonitoringStatus } from './src/monitoring';

console.log(getMonitoringStatus());
// {
//   sentry: { isEnabled: true, isInitialized: true },
//   store: { isInitialized: true, sessionCount: 5 }
// }
```

### 開發模式調試
```bash
export MONITORING_DEBUG=true
# 將在控制台輸出詳細的監控日誌
```

## 回滾和移除

### 快速回滾
```bash
# 使用準備好的回滾腳本
./scripts/rollback-sentry.sh
```

### 完全移除監控
```bash
# 1. 刪除監控目錄
rm -rf src/monitoring/

# 2. 移除監控調用
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '/monitor\./d'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '/from.*monitoring/d'

# 3. 移除依賴
npm uninstall @sentry/react-native
```

## 最佳實踐

1. **最小干預**：不要修改現有的業務邏輯
2. **安全優先**：所有監控操作都使用 `safe*` 方法
3. **上下文豐富**：提供有用的上下文資訊但不包含敏感數據
4. **性能意識**：避免在熱路徑中進行複雜的監控操作

## 故障排除

### 監控不工作
1. 檢查環境變數：`MONITORING_ENABLED`, `EMERGENCY_DISABLE_MONITORING`
2. 檢查 Sentry DSN 配置
3. 查看控制台日誌：開啟 `MONITORING_DEBUG=true`

### 性能影響
1. 檢查監控配置：關閉非必要功能
2. 使用性能分析工具測量實際影響
3. 調整事件記錄頻率

### 回滾需求
1. 使用 `./scripts/rollback-sentry.sh` 快速回滾
2. 或設置 `EMERGENCY_DISABLE_MONITORING=true` 暫時關閉

這個監控系統設計為完全被動和安全，可以在任何時候啟用或關閉，不會影響應用的核心功能。
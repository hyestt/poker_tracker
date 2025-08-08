# 🎯 RevenueCat 集成指南

## 📋 概述

本指南將協助您為 Poker Tracker 應用設置 RevenueCat 應用內購買和訂閱功能。

## 🚀 設置步驟

### 1. RevenueCat Dashboard 設置

1. **註冊 RevenueCat 帳號**
   - 訪問 [RevenueCat Dashboard](https://app.revenuecat.com)
   - 使用 GitHub 或 Google 帳號註冊

2. **創建新專案**
   - 點擊 "Create new project"
   - 專案名稱：`Poker Tracker`
   - 選擇適當的時區

3. **添加應用**
   - iOS App：添加 Bundle ID (例如：`com.yourcompany.pokertracker`)
   - Android App：添加 Package Name (例如：`com.yourcompany.pokertracker`)

### 2. App Store Connect 設置 (iOS)

1. **創建應用內購買產品**
   ```
   產品類型：Auto-Renewable Subscription
   
   建議訂閱計劃：
   - Monthly Premium: $9.99/月
   - Yearly Premium: $99.99/年 (節省17%)
   ```

2. **產品 ID 建議**
   ```
   - poker_tracker_monthly_premium
   - poker_tracker_yearly_premium
   ```

3. **權限設置**
   ```
   建議權限 (Entitlements)：
   - unlimited_sessions
   - ai_analysis
   - advanced_stats
   - export_data
   - cloud_sync
   - custom_tags
   ```

### 3. Google Play Console 設置 (Android)

1. **創建訂閱產品**
   - 產品 ID 與 iOS 保持一致
   - 設置相同的價格點

2. **測試帳號設置**
   - 添加測試帳號用於測試購買

### 4. RevenueCat 配置

1. **連接 App Store Connect**
   - 在 RevenueCat Dashboard 中添加 App Store Connect 集成
   - 上傳 App Store Connect API Key

2. **連接 Google Play Console**
   - 添加 Google Play Console 集成
   - 上傳服務帳號 JSON 文件

3. **創建 Offerings**
   ```
   Offering ID: default
   
   Packages:
   - Monthly: poker_tracker_monthly_premium
   - Yearly: poker_tracker_yearly_premium
   ```

4. **設置 Entitlements**
   ```
   - Premium Access (包含所有功能)
   - 將所有產品關聯到此權限
   ```

### 5. 獲取 API Keys

1. **iOS API Key**
   - 在 RevenueCat Dashboard → Project Settings → API Keys
   - 複製 iOS API Key

2. **Android API Key**
   - 複製 Android API Key

3. **更新代碼**
   ```typescript
   // fe_poker/src/services/RevenueCatService.ts
   const REVENUECAT_API_KEY = {
     ios: 'appl_YOUR_ACTUAL_IOS_API_KEY',
     android: 'goog_YOUR_ACTUAL_ANDROID_API_KEY'
   };
   ```

### 6. 測試設置

1. **沙盒測試 (iOS)**
   - 在 App Store Connect 中創建沙盒測試帳號
   - 在設備上登出 App Store，使用沙盒帳號登入

2. **測試購買流程**
   ```typescript
   // 測試代碼
   import revenueCatService from './services/RevenueCatService';
   
   // 初始化
   await revenueCatService.initialize();
   
   // 獲取訂閱計劃
   const plans = await revenueCatService.getSubscriptionPlans();
   
   // 檢查用戶狀態
   const isPremium = await revenueCatService.isPremiumUser();
   ```

## 🔧 功能特性

### Premium 功能列表

```typescript
interface PremiumFeatures {
  unlimitedSessions: boolean;    // 無限制 session 記錄
  aiAnalysis: boolean;           // AI 手牌分析
  advancedStats: boolean;        // 進階統計
  exportData: boolean;           // 數據導出
  cloudSync: boolean;            // 雲端同步
  customTags: boolean;           // 自定義標籤
}
```

### 使用範例

```typescript
// 檢查用戶是否為 Premium
const isPremium = await revenueCatService.isPremiumUser();

// 獲取具體功能權限
const features = await revenueCatService.getPremiumFeatures();

if (features.aiAnalysis) {
  // 顯示 AI 分析功能
} else {
  // 顯示升級提示
}
```

## 📱 UI 集成

### 1. 添加訂閱頁面到導航

```typescript
// App.tsx 或導航配置
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';

// 添加到 Stack Navigator
<Stack.Screen 
  name="Subscription" 
  component={SubscriptionScreen}
  options={{ title: 'Premium Subscription' }}
/>
```

### 2. 在設置頁面添加訂閱入口

```typescript
// SettingsScreen.tsx
<TouchableOpacity onPress={() => navigation.navigate('Subscription')}>
  <Text>🎯 Upgrade to Premium</Text>
</TouchableOpacity>
```

### 3. 功能限制提示

```typescript
// 在需要 Premium 功能的地方
if (!isPremium) {
  Alert.alert(
    'Premium Feature',
    'This feature requires a Premium subscription.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') }
    ]
  );
  return;
}
```

## 🔍 故障排除

### 常見問題

1. **API Key 錯誤**
   ```
   錯誤：RevenueCat initialization failed
   解決：檢查 API Key 是否正確，確保使用正確的平台 Key
   ```

2. **產品未找到**
   ```
   錯誤：Package not found
   解決：確保 App Store Connect 中的產品已審核通過
   ```

3. **購買失敗**
   ```
   錯誤：Purchase failed
   解決：檢查沙盒帳號設置，確保網絡連接正常
   ```

### 調試技巧

```typescript
// 啟用 RevenueCat 調試模式
import Purchases from 'react-native-purchases';

Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
```

## 📊 分析和監控

### RevenueCat Dashboard 功能

1. **收入分析**
   - 實時收入追蹤
   - 訂閱趨勢分析
   - 用戶生命週期價值

2. **用戶行為**
   - 轉換率分析
   - 流失率監控
   - A/B 測試支持

3. **Webhook 集成**
   - 實時事件通知
   - 後端系統集成
   - 自定義分析

## 🚀 部署檢查清單

- [ ] RevenueCat 專案已創建
- [ ] iOS/Android 應用已添加
- [ ] App Store Connect 集成完成
- [ ] Google Play Console 集成完成
- [ ] 產品和權限已設置
- [ ] API Keys 已更新到代碼中
- [ ] 沙盒測試通過
- [ ] UI 集成完成
- [ ] 功能限制邏輯實現
- [ ] 錯誤處理完善

## 📞 支持

- [RevenueCat 文檔](https://docs.revenuecat.com/)
- [React Native SDK 指南](https://docs.revenuecat.com/docs/react-native)
- [RevenueCat 社區](https://community.revenuecat.com/)

---

**注意：** 請確保在生產環境中使用真實的 API Keys，並遵循 App Store 和 Google Play 的應用內購買政策。 
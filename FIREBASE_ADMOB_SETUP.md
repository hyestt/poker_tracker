# Firebase & AdMob 設定指南

## 📋 概述

本指南將幫助你設定 Google Firebase 和 AdMob 以在 Poker Tracker 應用中顯示廣告。

## 🔥 Firebase 設定

### 1. 創建 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「創建專案」
3. 輸入專案名稱：`poker-tracker`
4. 選擇是否啟用 Google Analytics（建議啟用）
5. 完成專案創建

### 2. 添加 iOS 應用

1. 在 Firebase 專案中點擊「添加應用」
2. 選擇 iOS 圖標
3. 輸入 iOS Bundle ID：`com.yourcompany.pokertrackerapp`
4. 輸入應用暱稱：`Poker Tracker iOS`
5. 下載 `GoogleService-Info.plist` 文件
6. 將文件拖拽到 Xcode 專案的根目錄中

### 3. 添加 Android 應用（可選）

1. 點擊「添加應用」
2. 選擇 Android 圖標
3. 輸入 Android 包名：`com.yourcompany.pokertrackerapp`
4. 下載 `google-services.json` 文件
5. 將文件放置到 `android/app/` 目錄中

## 📱 AdMob 設定

### 1. 創建 AdMob 帳戶

1. 前往 [AdMob Console](https://admob.google.com/)
2. 使用與 Firebase 相同的 Google 帳戶登入
3. 創建新的 AdMob 帳戶

### 2. 創建應用

1. 在 AdMob 中點擊「應用」→「添加應用」
2. 選擇「是，它已在應用商店中列出」或「否，它是新應用」
3. 輸入應用資訊：
   - 應用名稱：`Poker Tracker`
   - 平台：iOS/Android
   - Bundle ID/Package Name：`com.yourcompany.pokertrackerapp`

### 3. 創建廣告單元

#### 橫幅廣告
1. 選擇你的應用
2. 點擊「廣告單元」→「添加廣告單元」
3. 選擇「橫幅」
4. 輸入廣告單元名稱：`Home Banner`
5. 複製廣告單元 ID

#### 插頁廣告
1. 添加新廣告單元
2. 選擇「插頁式」
3. 輸入廣告單元名稱：`Interstitial Ad`
4. 複製廣告單元 ID

#### 獎勵廣告
1. 添加新廣告單元
2. 選擇「獎勵」
3. 輸入廣告單元名稱：`Rewarded Ad`
4. 複製廣告單元 ID

## ⚙️ 代碼配置

### 1. 更新 AdMob 服務

在 `fe_poker/src/services/AdMobService.ts` 中更新廣告單元 ID：

\`\`\`typescript
const AD_UNIT_IDS = {
  ios: {
    banner: 'ca-app-pub-YOUR_PUBLISHER_ID/YOUR_BANNER_AD_UNIT_ID',
    interstitial: 'ca-app-pub-YOUR_PUBLISHER_ID/YOUR_INTERSTITIAL_AD_UNIT_ID',
    rewarded: 'ca-app-pub-YOUR_PUBLISHER_ID/YOUR_REWARDED_AD_UNIT_ID',
  },
  android: {
    banner: 'ca-app-pub-YOUR_PUBLISHER_ID/YOUR_BANNER_AD_UNIT_ID',
    interstitial: 'ca-app-pub-YOUR_PUBLISHER_ID/YOUR_INTERSTITIAL_AD_UNIT_ID',
    rewarded: 'ca-app-pub-YOUR_PUBLISHER_ID/YOUR_REWARDED_AD_UNIT_ID',
  }
};
\`\`\`

### 2. iOS 配置

在 `ios/PokerTrackerApp/Info.plist` 中添加：

\`\`\`xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-YOUR_ADMOB_APP_ID~YOUR_APP_ID</string>
\`\`\`

### 3. Android 配置（如果需要）

在 `android/app/src/main/AndroidManifest.xml` 中添加：

\`\`\`xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-YOUR_ADMOB_APP_ID~YOUR_APP_ID"/>
\`\`\`

## 🧪 測試

### 開發環境
- 應用會自動使用測試廣告單元 ID
- 不需要真實的廣告單元 ID 即可測試

### 生產環境
- 確保已設定真實的廣告單元 ID
- 在 App Store/Google Play 發布前進行完整測試

## 📊 廣告策略建議

### 橫幅廣告
- 在主頁面底部顯示
- 不干擾用戶操作
- 適合持續展示

### 插頁廣告
- 在會話結束後顯示
- 在導航到新頁面時顯示
- 不要過於頻繁

### 獎勵廣告
- 提供額外功能解鎖
- 免費 AI 分析次數
- 額外統計功能

## 🔧 故障排除

### 常見問題

1. **廣告不顯示**
   - 檢查網路連接
   - 確認廣告單元 ID 正確
   - 檢查 AdMob 帳戶狀態

2. **iOS 編譯錯誤**
   - 確保 `GoogleService-Info.plist` 已正確添加
   - 檢查 Bundle ID 是否匹配

3. **廣告載入失敗**
   - 檢查控制台錯誤訊息
   - 確認應用已在 AdMob 中正確設定

### 調試技巧

1. 啟用詳細日誌：
\`\`\`typescript
// 在開發環境中啟用
if (__DEV__) {
  console.log('AdMob Debug Mode Enabled');
}
\`\`\`

2. 檢查廣告載入狀態：
\`\`\`typescript
console.log('Interstitial ready:', adMobService.isInterstitialReady());
console.log('Rewarded ready:', adMobService.isRewardedReady());
\`\`\`

## 📈 收益優化

### 最佳實踐

1. **廣告位置**
   - 選擇不干擾用戶體驗的位置
   - 確保廣告可見但不突兀

2. **廣告頻率**
   - 避免過度展示廣告
   - 平衡用戶體驗和收益

3. **廣告類型**
   - 混合使用不同類型的廣告
   - 根據用戶行為調整策略

## 🚀 部署檢查清單

- [ ] Firebase 專案已創建
- [ ] AdMob 帳戶已設定
- [ ] 廣告單元已創建
- [ ] 配置文件已添加到專案
- [ ] 廣告單元 ID 已更新
- [ ] 測試廣告正常顯示
- [ ] 生產環境配置已完成
- [ ] App Store/Google Play 政策已確認

## 📞 支援

如果遇到問題，請參考：
- [Firebase 文檔](https://firebase.google.com/docs)
- [AdMob 文檔](https://developers.google.com/admob)
- [React Native Firebase](https://rnfirebase.io/)
- [React Native Google Mobile Ads](https://docs.page/invertase/react-native-google-mobile-ads) 
# Live Hand APP 圖示設置完成指南

## 已完成的工作
✅ 已更新 iOS AppIcon.appiconset/Contents.json 配置文件
✅ 已設置正確的文件名映射

## 你需要完成的步驟

### 1. 準備 Live Hand Logo 圖片
- 將你提供的圓形 Live Hand logo 保存為 PNG 格式
- 建議保存為 `live_hand_logo.png`

### 2. 使用線上工具生成各種尺寸
推薦使用以下任一工具：
- **appicon.co** (免費，推薦)
- **makeappicon.com** 
- **iconkitchen.com**

上傳你的 Live Hand logo，選擇 iOS + Android，下載生成的圖示包。

### 3. iOS 圖示部署
將下載的圖示文件複製到：
```
fe_poker/ios/PokerTrackerApp/Images.xcassets/AppIcon.appiconset/
```

需要的文件名和尺寸：
- `AppIcon-20x20@2x.png` (40x40)
- `AppIcon-20x20@3x.png` (60x60) 
- `AppIcon-29x29@2x.png` (58x58)
- `AppIcon-29x29@3x.png` (87x87)
- `AppIcon-40x40@2x.png` (80x80)
- `AppIcon-40x40@3x.png` (120x120)
- `AppIcon-60x60@2x.png` (120x120)
- `AppIcon-60x60@3x.png` (180x180)
- `AppIcon-1024x1024@1x.png` (1024x1024)

### 4. Android 圖示部署
替換以下目錄中的 `ic_launcher.png` 和 `ic_launcher_round.png`：

```
fe_poker/android/app/src/main/res/mipmap-mdpi/     (48x48)
fe_poker/android/app/src/main/res/mipmap-hdpi/     (72x72)
fe_poker/android/app/src/main/res/mipmap-xhdpi/    (96x96)
fe_poker/android/app/src/main/res/mipmap-xxhdpi/   (144x144)
fe_poker/android/app/src/main/res/mipmap-xxxhdpi/  (192x192)
```

### 5. 測試新圖示
完成圖示替換後，執行：

```bash
# 清除快取
cd fe_poker
npx react-native start --reset-cache

# 重新建置和測試
npm run ios    # 測試 iOS
npm run android # 測試 Android
```

### 6. 驗證
- 檢查裝置主畫面上的應用圖示
- 確認在 App Store/Google Play 預覽中顯示正確
- 測試不同尺寸設備上的顯示效果

## 注意事項
- 所有圖示文件必須是 PNG 格式
- 確保圖片背景透明或純色
- iOS 圖示不需要圓角（系統會自動添加）
- Android 提供圓形和正方形兩個版本

完成這些步驟後，你的 Live Hand logo 將在 iOS 和 Android 上正確顯示！
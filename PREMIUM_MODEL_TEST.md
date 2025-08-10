# Premium Model Implementation Test

## 新的付費模式說明

### 📱 免費用戶
- ✅ **無限手動記錄**: 可以無限記錄撲克手牌
- ✅ **每日1次免費GTO分析**: 每天可免費使用1次GTO分析
- ✅ **基本統計功能**: 查看基本的撲克統計數據
- ✅ **基本Session追蹤**: 記錄撲克Session

### 💎 Premium 用戶
- ✅ **所有免費功能**
- ✅ **無限GTO分析**: 每天無限次GTO分析
- ✅ **進階統計功能**
- ✅ **數據導出**
- ✅ **雲端同步**
- ✅ **自定義標籤**
- ✅ **優先客服支持**

## 實現的功能

### 1. RevenueCatService 更新
- [x] 新增 `GTOAnalysisQuota` 介面用於追蹤每日配額
- [x] 實現 `getGTOAnalysisQuota()` - 管理每日重置邏輯
- [x] 實現 `canUseGTOAnalysis()` - 檢查付費狀態和配額
- [x] 實現 `useGTOAnalysis()` - 消耗非付費用戶的配額
- [x] 更新訂閱方案描述以強調無限GTO分析

### 2. AI分析頁面更新
- [x] 在分析開始前檢查配額
- [x] 為非付費用戶顯示配額已達上限頁面
- [x] 在頁首顯示剩餘免費分析次數
- [x] 分析前進行付費檢查

### 3. 手牌詳情頁面更新
- [x] 新增配額狀態檢查和顯示
- [x] 在GTO分析按鈕顯示剩餘免費分析次數
- [x] 配額用完時按鈕變為禁用狀態
- [x] 配額達到上限時顯示升級提示

### 4. 訂閱頁面更新
- [x] 新增「永遠免費功能」區塊，顯示：
  - ✅ 無限手動手牌記錄
  - ✅ 每日1次免費GTO分析
  - ✅ 基本Session追蹤
  - ✅ 基本統計數據
- [x] 更新付費方案描述

## 測試檢查清單

### 免費用戶體驗
- [ ] 可以無限記錄手牌
- [ ] 每天可以使用1次免費GTO分析
- [ ] 用完免費分析後會顯示升級提示
- [ ] 隔天配額會自動重置
- [ ] 訂閱頁面正確顯示免費和付費功能

### 付費用戶體驗  
- [ ] 可以無限使用GTO分析
- [ ] UI上顯示「無限」而非數字
- [ ] 不會看到配額限制提示

### UI/UX測試
- [ ] 配額指示器正確顯示剩餘次數
- [ ] 升級提示正確導向訂閱頁面
- [ ] 按鈕禁用狀態視覺回饋清晰
- [ ] 錯誤訊息和提示文字友善易懂

## 技術實現細節

### AsyncStorage 配額儲存
- 儲存key: `gto_analysis_quota`
- 格式: `{ date: "YYYY-MM-DD", usedCount: number, maxFreeCount: 1 }`
- 每日自動重置邏輯

### 配額檢查邏輯
1. 檢查是否為付費用戶 → 無限制
2. 檢查今日日期是否相同 → 不同則重置
3. 檢查 usedCount < maxFreeCount → 可使用
4. 使用後 usedCount += 1

## Debug 指令

在開發環境中可以使用以下方法測試：

```javascript
// 重置配額（用於測試）
RevenueCatService.resetGTOQuotaForTesting();

// 設置測試付費狀態
RevenueCatService.setTestPremiumStatus(true); // 設為付費用戶
RevenueCatService.setTestPremiumStatus(false); // 設為免費用戶
```
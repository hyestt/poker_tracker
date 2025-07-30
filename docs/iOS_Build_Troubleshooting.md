# iOS Build 故障排除指南

## 问题：某个 iOS 模拟器无法构建，但其他模拟器可以

### 症状
- 某个特定的 iPhone 模拟器（如 iPhone 16）构建失败
- 其他模拟器（如 iPhone 16 Pro）可以正常构建和运行
- 出现 "Failed to query serialized dependencies" 错误
- 构建过程卡住或超时

### 根本原因
1. **Xcode 构建缓存问题**：每个模拟器有独立的构建缓存
2. **DerivedData 损坏**：编译中间文件可能损坏
3. **架构切换问题**：在 Legacy 和 New Architecture 之间切换时的缓存不一致

### 解决步骤

#### 步骤 1：清理 Xcode DerivedData
```bash
# 删除特定项目的 DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/PokerTrackerApp-*

# 或者删除所有 DerivedData（更彻底）
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

#### 步骤 2：清理项目构建文件
```bash
cd fe_poker/ios
rm -rf build/
```

#### 步骤 3：清理 React Native 缓存
```bash
cd fe_poker
npx react-native clean --include "metro,watchman,cocoapods"
```

#### 步骤 4：重新安装依赖
```bash
# 清理并重新安装 node_modules
cd fe_poker
rm -rf node_modules
npm install

# 清理并重新安装 CocoaPods
cd ios
rm -rf Pods Podfile.lock
pod install
```

#### 步骤 5：重新构建
```bash
cd fe_poker
npm run ios -- --simulator="iPhone 16"
```

### 快速解决方案（如果赶时间）
如果需要快速解决，可以直接使用能正常工作的模拟器：
```bash
npm run ios -- --simulator="iPhone 16 Pro"
```

### 预防措施

1. **定期清理缓存**
   - 每周清理一次 DerivedData
   - 切换架构前先清理缓存

2. **使用固定的开发设备**
   - 选择一个主要的模拟器进行日常开发
   - 只在发布前测试其他设备

3. **保持依赖更新**
   - 定期更新 React Native 和相关依赖
   - 及时处理废弃警告

### 其他常见问题

#### Legacy Architecture 警告
```
The app is running using the Legacy Architecture. The Legacy Architecture is deprecated...
```

**解决方法**：
1. 临时忽略：不影响功能，可以继续开发
2. 永久解决：启用 New Architecture
   ```
   # 编辑 ios/Podfile
   :fabric_enabled => true
   ```

#### 数据库在不同模拟器间不共享
- **原因**：每个模拟器有独立的文件系统
- **解决**：使用应用内的导入/导出功能传输数据

### 命令速查表

```bash
# 完整清理和重建流程
cd fe_poker
rm -rf ~/Library/Developer/Xcode/DerivedData/PokerTrackerApp-*
rm -rf ios/build/
npx react-native clean --include "metro,watchman,cocoapods"
rm -rf node_modules && npm install
cd ios && rm -rf Pods Podfile.lock && pod install
cd .. && npm run ios
```

### 何时需要测试多个设备？

**需要测试的情况**：
- UI 布局变更
- 发布前的最终测试
- 处理设备特定的 bug

**不需要每个设备都测试**：
- 日常功能开发
- 逻辑修改
- 数据处理相关功能

### 推荐的测试设备组合
1. **主要开发**：iPhone 16 或 iPhone 15 Pro
2. **屏幕适配测试**：
   - 小屏：iPhone SE
   - 标准：iPhone 16
   - 大屏：iPhone 16 Pro Max
3. **最低版本测试**：支持的最低 iOS 版本设备

---

最后更新：2025-01-29
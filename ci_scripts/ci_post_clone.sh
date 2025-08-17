#!/bin/sh
set -e

# 打印診斷信息
echo "=== Xcode Cloud CI 診斷信息 ==="
echo "工作目錄: $(pwd)"
echo "環境變量:"
env | grep -E "(CI|XCODE|BUILD)" || true
echo ""

# 驗證項目結構
echo "=== 驗證項目結構 ==="
if [ ! -d "fe_poker" ]; then
    echo "錯誤: fe_poker 目錄不存在"
    exit 1
fi

cd fe_poker
echo "當前目錄: $(pwd)"
echo "package.json 存在: $(test -f package.json && echo '是' || echo '否')"

# 清理並安裝依賴
echo "=== 安裝 Node.js 依賴 ==="
npm ci

# 驗證 React Native 和 Yoga 路徑
echo "=== 驗證 React Native 結構 ==="
RN_PATH="node_modules/react-native"
YOGA_PATH="$RN_PATH/ReactCommon/yoga"

echo "React Native 路徑: $RN_PATH"
echo "React Native 存在: $(test -d "$RN_PATH" && echo '是' || echo '否')"
echo "Yoga 路徑: $YOGA_PATH"
echo "Yoga 目錄存在: $(test -d "$YOGA_PATH" && echo '是' || echo '否')"

if [ -d "$YOGA_PATH/yoga" ]; then
    echo "Yoga 源文件目錄存在"
    echo "關鍵 Yoga 文件檢查:"
    for file in YGNodeStyle.cpp YGNodeLayout.cpp YGValue.cpp YGPixelGrid.cpp; do
        if [ -f "$YOGA_PATH/yoga/$file" ]; then
            echo "  ✓ $file 存在"
        else
            echo "  ✗ $file 缺失"
        fi
    done
    
    if [ -f "$YOGA_PATH/yoga/event/event.cpp" ]; then
        echo "  ✓ event/event.cpp 存在"
    else
        echo "  ✗ event/event.cpp 缺失"
    fi
else
    echo "警告: Yoga 源文件目錄不存在"
fi

# 安裝 CocoaPods 依賴
echo "=== 安裝 CocoaPods 依賴 ==="
cd ios
echo "當前 iOS 目錄: $(pwd)"
echo "Podfile 存在: $(test -f Podfile && echo '是' || echo '否')"

# 創建符號鏈接確保路徑正確（如果需要）
if [ ! -L "../../node_modules" ] && [ -d "../node_modules" ]; then
    echo "創建 node_modules 符號鏈接以確保路徑一致性"
    ln -sf ../node_modules ../../node_modules || true
fi

pod install --verbose

echo "=== CI 腳本完成 ==="

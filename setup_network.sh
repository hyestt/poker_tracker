#!/bin/bash

echo "🌐 Poker Tracker Network Setup"
echo "==============================="

# 自動獲取本機IP
LOCAL_IP=$(ifconfig | grep 'inet ' | grep -v '127.0.0.1' | head -1 | awk '{print $2}')

if [ -z "$LOCAL_IP" ]; then
    echo "❌ 無法獲取本機IP，將使用localhost"
    LOCAL_IP="localhost"
else
    echo "✅ 檢測到本機IP: $LOCAL_IP"
fi

# 更新前端配置
echo "📱 更新前端API配置..."

# 建立.env文件給React Native使用
cat > fe_poker/.env << EOF
REACT_NATIVE_API_HOST=$LOCAL_IP
EOF

# 更新sessionStore.ts為更智能的配置
cat > fe_poker/src/config/api.ts << 'EOF'
// API配置文件
const getLocalIP = (): string => {
  // 在React Native中，你可以通過這種方式獲取本機IP
  // 這裡提供一個fallback機制
  
  // 優先使用環境變數
  if (process.env.REACT_NATIVE_API_HOST) {
    return process.env.REACT_NATIVE_API_HOST;
  }
  
  // 針對不同平台的配置
  if (__DEV__) {
    // 開發模式下的配置
    if (process.env.NODE_ENV === 'development') {
      // 如果是iOS模擬器，使用本機IP
      // 如果是Android模擬器，使用10.0.2.2
      // 如果是網頁，使用localhost
      return 'localhost'; // 預設值，可被環境變數覆蓋
    }
  }
  
  return 'localhost';
};

export const API_BASE_URL = `http://${getLocalIP()}:8080`;
export const getAPIUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;
EOF

# 確保目錄存在
mkdir -p fe_poker/src/config

# 更新sessionStore.ts使用新的配置
sed -i '' 's|const API_URL = getAPIURL();|import { API_BASE_URL } from "../config/api";\nconst API_URL = API_BASE_URL;|' fe_poker/src/viewmodels/sessionStore.ts

# 移除舊的getAPIURL函數
sed -i '' '/\/\/ 動態獲取API URL的函數/,/^const API_URL/c\
import { API_BASE_URL } from "../config/api";\
const API_URL = API_BASE_URL;' fe_poker/src/viewmodels/sessionStore.ts

echo "✅ 前端配置已更新"

# 更新後端顯示資訊
echo "🔄 更新後端啟動腳本..."
sed -i '' "s|echo \"🔗 Backend URL: http://.*:8080\"|echo \"🔗 Backend URL: http://$LOCAL_IP:8080\"|" start_server.sh
sed -i '' "s|curl -s -X POST http://.*:8080/analyze|curl -s -X POST http://$LOCAL_IP:8080/analyze|" start_server.sh

echo "✅ 後端配置已更新"

echo ""
echo "🎉 網路配置完成！"
echo "📍 後端地址: http://$LOCAL_IP:8080"
echo "📱 前端將自動連接到: $LOCAL_IP"
echo ""
echo "💡 使用方式："
echo "   1. 每次換網路環境時運行: ./setup_network.sh"
echo "   2. 然後重啟服務器: ./start_server.sh"
echo "   3. 重新啟動React Native app"
echo ""

# 讓腳本可執行
chmod +x setup_network.sh 
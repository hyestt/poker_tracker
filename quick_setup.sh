#!/bin/bash

echo "🚀 Quick Network Setup for Poker Tracker"
echo "========================================="

# 自動獲取本機IP
LOCAL_IP=$(ifconfig | grep 'inet ' | grep -v '127.0.0.1' | head -1 | awk '{print $2}')

if [ -z "$LOCAL_IP" ]; then
    echo "❌ 無法獲取本機IP，將使用localhost"
    LOCAL_IP="localhost"
else
    echo "✅ 檢測到本機IP: $LOCAL_IP"
fi

# 更新.env文件
echo "REACT_NATIVE_API_HOST=$LOCAL_IP" > fe_poker/.env
echo "📱 已更新前端配置: $LOCAL_IP"

# 更新後端啟動腳本中的測試URL
sed -i '' "s|http://[0-9.]*:8080|http://$LOCAL_IP:8080|g" start_server.sh

echo "🎉 網路設定完成！"
echo ""
echo "💡 下一步："
echo "   1. 重啟後端: ./start_server.sh"
echo "   2. 重啟React Native應用程式"
echo "   3. API將連接到: http://$LOCAL_IP:8080" 
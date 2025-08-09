#!/bin/bash

# 开发脚本：同时启动多个 work tree 的开发环境

echo "Starting development servers for multiple work trees..."

# 启动主版本 (端口 8081)
echo "Starting main version on port 8081..."
cd /Users/glenhsu/Desktop/workspace/poker_tracker/fe_poker
npm start &

# 启动 new_feature 版本 (端口 8082)  
echo "Starting new_feature version on port 8082..."
cd /Users/glenhsu/Desktop/workspace/poker_tracker/.tree/new_feature/fe_poker
npm start -- --port 8082 &

echo "Development servers started!"
echo "Main version: http://localhost:8081"
echo "Feature version: http://localhost:8082"
echo ""
echo "Configure your simulators:"
echo "- Shake device → Settings → Debug server host & port"
echo "- Set to localhost:8081 or localhost:8082"
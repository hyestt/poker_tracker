#!/bin/bash

echo "🛑 Poker Tracker - 停止所有服務"
echo "============================="

# 停止後端
echo "🔴 停止後端服務器..."
if [ -f backend.pid ]; then
    kill $(cat backend.pid) 2>/dev/null || true
    rm -f backend.pid
fi
pkill -f "go run main.go" 2>/dev/null || true

# 停止Metro (React Native bundler)
echo "🔴 停止Metro bundler..."
pkill -f "react-native start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

# 停止npm start
pkill -f "npm start" 2>/dev/null || true

echo "✅ 所有服務已停止" 
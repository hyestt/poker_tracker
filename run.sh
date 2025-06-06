#!/bin/bash

# 簡化的 Poker Tracker 啟動腳本

echo "🃏 Starting Poker Tracker Backend..."

# 載入環境變數
source ~/.bash_profile

# 進入後端目錄並啟動
cd be_poker
go run main.go 
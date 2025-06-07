#!/bin/bash

echo "🎯 Poker Tracker - Prompt 編輯器"
echo "=============================="

PROMPTS_DIR="be_poker/prompts"

# 確保prompts目錄存在
mkdir -p "$PROMPTS_DIR"

# 列出所有可用的prompt文件
echo "📝 可用的 Prompt 文件："
echo ""
ls -1 "$PROMPTS_DIR"/*.txt 2>/dev/null | while read file; do
    filename=$(basename "$file")
    echo "  • $filename"
done

echo ""
echo "💡 使用方式："
echo "   1. 直接編輯文件: nano be_poker/prompts/hand_analysis.txt"
echo "   2. 使用VS Code: code be_poker/prompts/hand_analysis.txt"
echo "   3. 查看所有prompts: ls be_poker/prompts/"
echo ""

# 如果有參數，直接打開對應文件
if [ "$1" ]; then
    PROMPT_FILE="$PROMPTS_DIR/$1"
    if [ -f "$PROMPT_FILE" ]; then
        echo "🚀 打開文件: $PROMPT_FILE"
        if command -v code >/dev/null 2>&1; then
            code "$PROMPT_FILE"
        elif command -v nano >/dev/null 2>&1; then
            nano "$PROMPT_FILE"
        else
            echo "請手動編輯文件: $PROMPT_FILE"
        fi
    else
        echo "❌ 文件不存在: $PROMPT_FILE"
        echo "可用文件："
        ls -1 "$PROMPTS_DIR"/*.txt 2>/dev/null | basename -s .txt
    fi
fi

echo ""
echo "🔧 Prompt 變數說明："
echo "   {{HAND_DETAILS}} - 會被替換為手牌詳情"
echo "   {{RESULT}} - 會被替換為手牌結果"
echo ""
echo "📋 可用的 Prompt 模板："
echo "   • hand_analysis.txt - 標準分析 (400-600字)"
echo "   • hand_analysis_detailed.txt - 詳細分析 (800-1000字)"  
echo "   • hand_analysis_simple.txt - 簡單分析 (200字)" 
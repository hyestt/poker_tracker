#!/bin/bash

# OpenAI API Key Setup Script for Poker Tracker

echo "🎯 Poker Tracker - OpenAI API Key Setup"
echo "========================================"
echo ""

# Check if API key is provided as argument
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your OpenAI API key"
    echo ""
    echo "Usage: ./setup_openai.sh YOUR_API_KEY"
    echo ""
    echo "Example: ./setup_openai.sh sk-..."
    echo ""
    echo "📝 To get your API key:"
    echo "1. Go to https://platform.openai.com"
    echo "2. Login to your account"
    echo "3. Go to API Keys section"
    echo "4. Create a new secret key"
    echo ""
    exit 1
fi

API_KEY="$1"

echo "🔧 Setting up OpenAI API Key..."
echo ""

# Export the environment variable for current session
export OPENAI_API_KEY="$API_KEY"

# Add to .zshrc for permanent setup
if [ -f ~/.zshrc ]; then
    # Remove any existing OPENAI_API_KEY lines
    grep -v "OPENAI_API_KEY" ~/.zshrc > ~/.zshrc.tmp
    mv ~/.zshrc.tmp ~/.zshrc
    # Add new API key
    echo "export OPENAI_API_KEY=\"$API_KEY\"" >> ~/.zshrc
    echo "✅ Added to ~/.zshrc for permanent setup"
fi

# Add to .bash_profile for bash users
if [ -f ~/.bash_profile ]; then
    # Remove any existing OPENAI_API_KEY lines
    grep -v "OPENAI_API_KEY" ~/.bash_profile > ~/.bash_profile.tmp
    mv ~/.bash_profile.tmp ~/.bash_profile
    # Add new API key
    echo "export OPENAI_API_KEY=\"$API_KEY\"" >> ~/.bash_profile
    echo "✅ Added to ~/.bash_profile for permanent setup"
fi

echo "✅ Environment variable set for current session"
echo ""

# Restart backend with new API key
echo "🔄 Restarting backend server..."
cd poker_tracker_backend

# Kill existing server
pkill -f "go run main.go" 2>/dev/null

# Start new server with API key
OPENAI_API_KEY="$API_KEY" go run main.go &

echo "✅ Backend server restarted with OpenAI API key"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "📱 You can now use AI Analysis in your Poker Tracker app"
echo ""
echo "💡 To test the setup:"
echo "   1. Open your app"
echo "   2. Go to a hand record"
echo "   3. Tap 'AI Analysis' button"
echo ""
echo "💰 Cost: ~$0.0003-0.0008 per analysis (GPT-4o-mini)"
echo ""

# Test the API
echo "🧪 Testing API connection..."
sleep 3
curl -s -X POST http://192.168.1.28:8080/analyze -H "Content-Type: application/json" -d '{"handId":"test"}' | grep -q "Hand not found" && echo "✅ API endpoint working!" || echo "❌ API test failed"

echo ""
echo "🔄 To reload shell environment: source ~/.zshrc" 
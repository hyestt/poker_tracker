#!/bin/bash

# Recovery Script - Clean and restore environment

echo "🚨 Starting environment recovery..."

# 1. Clean node_modules and reinstall
echo "🧹 Cleaning node_modules..."
rm -rf node_modules
rm -rf package-lock.json yarn.lock

# 2. Clean iOS build
echo "🍎 Cleaning iOS build..."
cd ios
rm -rf build
rm -rf Pods
rm -rf Podfile.lock
cd ..

# 3. Clean React Native cache
echo "🗑️ Cleaning React Native cache..."
npx react-native start --reset-cache &
sleep 2
pkill -f "react-native start"

# 4. Clean Metro cache
rm -rf /tmp/metro-*
rm -rf /tmp/haste-map-*

# 5. Reinstall dependencies
echo "📦 Reinstalling dependencies..."
if [ -f "yarn.lock.backup" ]; then
    cp yarn.lock.backup yarn.lock
    yarn install --frozen-lockfile
elif [ -f "package-lock.json.backup" ]; then
    cp package-lock.json.backup package-lock.json
    npm ci
else
    if command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
fi

# 6. Reinstall iOS pods
echo "🍎 Reinstalling iOS pods..."
cd ios && pod install && cd ..

echo "✅ Recovery complete! Try running your app now." 
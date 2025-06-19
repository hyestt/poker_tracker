#!/bin/bash

# This script performs a thorough cleanup of the React Native project environment.
# It should be run from the project root directory.
# Use this script when switching branches or encountering persistent build issues.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🟢 Starting the safe installation process..."

# Navigate to the frontend project directory
# This assumes you run the script from the project root (poker_tracker/)
if [ ! -d "fe_poker" ]; then
  echo "❌ Error: 'fe_poker' directory not found. Please run this script from the project root."
  exit 1
fi
cd fe_poker

# --- Step 1: Clean JavaScript Dependencies ---
echo "🧹 Step 1/4: Cleaning JavaScript dependencies (node_modules, package-lock.json)..."
rm -rf node_modules
rm -f package-lock.json

echo "📦 Step 2/4: Installing fresh JavaScript dependencies..."
npm install

# --- Step 3: Clean iOS Native Dependencies ---
echo "🧹 Step 3/4: Cleaning and installing iOS (CocoaPods) dependencies..."
cd ios
rm -rf Pods
rm -f Podfile.lock
pod install
cd ..

# --- Step 4: Clear Metro Cache ---
echo "🧹 Step 4/4: Clearing Metro bundler cache..."
npx react-native start --reset-cache --background &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null || true

echo ""
echo "✅ Safe installation process completed successfully!"
echo "🚀 You can now try to build and run your app."
echo "   Run: cd fe_poker && npx react-native run-ios --simulator=\"iPhone 15 Pro\"" 
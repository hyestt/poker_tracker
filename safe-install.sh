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
echo "🧹 Step 1/3: Cleaning JavaScript dependencies (node_modules, package-lock.json)..."
rm -rf node_modules
rm -f package-lock.json

echo "📦 Step 2/3: Installing fresh JavaScript dependencies..."
npm install

# --- Step 3: Clean iOS Native Dependencies ---
echo "🧹 Step 3/3: Cleaning and installing iOS (CocoaPods) dependencies..."
cd ios
rm -rf Pods
rm -f Podfile.lock
pod install
cd ..

echo ""
echo "✅ Safe installation process completed successfully!"
echo "🚀 You can now try to build and run your app."
echo "   In one terminal, run: cd fe_poker && npx react-native start --reset-cache"
echo "   In another terminal, run: cd fe_poker && npx react-native run-ios" 
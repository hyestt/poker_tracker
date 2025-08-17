#!/bin/sh

# Exit on any failure
set -e

echo "🔧 CI Post Clone Script Started"

# Change to the iOS directory
cd ios

echo "📦 Installing CocoaPods dependencies..."

# Install CocoaPods if not available
if ! command -v pod &> /dev/null; then
    echo "Installing CocoaPods..."
    gem install cocoapods
fi

# Install pods
echo "Running pod install..."
pod install

echo "✅ CI Post Clone Script Completed"
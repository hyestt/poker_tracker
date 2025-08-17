#!/bin/sh

# Exit on any failure
set -e

echo "🔧 CI Post Clone Script Started"
echo "📍 Current directory: $(pwd)"
echo "📂 Directory contents:"
ls -la

# Navigate to the project root if needed
if [ -d "fe_poker" ]; then
    cd fe_poker
    echo "📍 Changed to fe_poker directory: $(pwd)"
fi

# Change to the iOS directory
if [ -d "ios" ]; then
    cd ios
    echo "📍 Changed to iOS directory: $(pwd)"
    echo "📂 iOS directory contents:"
    ls -la
else
    echo "❌ iOS directory not found!"
    exit 1
fi

echo "📦 Installing CocoaPods dependencies..."

# Install CocoaPods if not available
if ! command -v pod &> /dev/null; then
    echo "Installing CocoaPods..."
    gem install cocoapods
else
    echo "✅ CocoaPods already available: $(pod --version)"
fi

# Check if Podfile exists
if [ -f "Podfile" ]; then
    echo "✅ Podfile found"
    
    # Clean up any existing Pods to ensure fresh install
    if [ -d "Pods" ]; then
        echo "🧹 Removing existing Pods directory..."
        rm -rf Pods
    fi
    
    if [ -f "Podfile.lock" ]; then
        echo "📋 Podfile.lock exists"
    fi
    
    echo "🔄 Running pod install..."
    pod install --repo-update
    echo "✅ Pod install completed"
    
    # Verify installation
    if [ -d "Pods" ]; then
        echo "✅ Pods directory created successfully"
        echo "📂 Pods contents:"
        ls -la Pods/ | head -10
    else
        echo "❌ Pod install failed - Pods directory not created"
        exit 1
    fi
else
    echo "❌ Podfile not found!"
    exit 1
fi

echo "✅ CI Post Clone Script Completed"
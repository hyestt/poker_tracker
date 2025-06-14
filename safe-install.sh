#!/bin/bash

# Safe Library Installation Script
# Usage: ./safe-install.sh <package-name>

if [ -z "$1" ]; then
    echo "Usage: ./safe-install.sh <package-name>"
    exit 1
fi

PACKAGE_NAME=$1
BRANCH_NAME="feature/add-$PACKAGE_NAME-$(date +%Y%m%d-%H%M%S)"

echo "🔄 Creating safety checkpoint..."

# 1. Create environment snapshot
./environment-snapshot.sh

# 2. Commit current state
git add .
git commit -m "Checkpoint before installing $PACKAGE_NAME"

# 3. Create new branch
git checkout -b "$BRANCH_NAME"

echo "✅ Safety checkpoint created on branch: $BRANCH_NAME"
echo "📦 Installing $PACKAGE_NAME..."

# 4. Install package
if command -v yarn &> /dev/null; then
    yarn add "$PACKAGE_NAME"
else
    npm install "$PACKAGE_NAME"
fi

# 5. Update iOS dependencies
echo "🍎 Updating iOS dependencies..."
cd ios && pod install && cd ..

echo "🧪 Testing installation..."
echo "Run your app now. If it works, commit the changes."
echo "If it fails, run: git checkout main && git branch -D $BRANCH_NAME" 
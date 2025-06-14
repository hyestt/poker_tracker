#!/bin/bash

# Environment Snapshot Script
# Run this before installing new dependencies

echo "=== Environment Snapshot $(date) ===" > env-snapshot.txt

echo -e "\n=== System Info ===" >> env-snapshot.txt
echo "OS: $(uname -a)" >> env-snapshot.txt
echo "Node: $(node --version)" >> env-snapshot.txt
echo "NPM: $(npm --version)" >> env-snapshot.txt
echo "Yarn: $(yarn --version)" >> env-snapshot.txt

echo -e "\n=== React Native ===" >> env-snapshot.txt
echo "RN CLI: $(npx react-native --version)" >> env-snapshot.txt

echo -e "\n=== iOS Environment ===" >> env-snapshot.txt
echo "Xcode: $(xcodebuild -version)" >> env-snapshot.txt
echo "iOS Simulator: $(xcrun simctl list runtimes | grep iOS)" >> env-snapshot.txt
echo "CocoaPods: $(pod --version)" >> env-snapshot.txt

echo -e "\n=== Ruby (for CocoaPods) ===" >> env-snapshot.txt
echo "Ruby: $(ruby --version)" >> env-snapshot.txt
echo "Bundler: $(bundle --version)" >> env-snapshot.txt

echo -e "\n=== Package Versions ===" >> env-snapshot.txt
if [ -f "package.json" ]; then
    echo "Dependencies from package.json:" >> env-snapshot.txt
    cat package.json | jq '.dependencies' >> env-snapshot.txt
    echo -e "\nDevDependencies from package.json:" >> env-snapshot.txt
    cat package.json | jq '.devDependencies' >> env-snapshot.txt
fi

if [ -f "ios/Podfile.lock" ]; then
    echo -e "\n=== CocoaPods Lock ===" >> env-snapshot.txt
    head -20 ios/Podfile.lock >> env-snapshot.txt
fi

echo -e "\n=== Git Status ===" >> env-snapshot.txt
git status --porcelain >> env-snapshot.txt
git log --oneline -5 >> env-snapshot.txt

echo "Environment snapshot saved to env-snapshot.txt" 
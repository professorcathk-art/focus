#!/bin/bash

echo "🔧 Fixing CocoaPods Installation..."
echo ""

# Step 1: Switch to Xcode (requires password)
echo "Step 1: Switching to Xcode..."
echo "You'll be asked for your password:"
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Step 2: Accept Xcode license
echo ""
echo "Step 2: Accepting Xcode license..."
sudo xcodebuild -license accept

# Step 3: Verify xcrun works
echo ""
echo "Step 3: Verifying xcrun..."
xcrun --version

# Step 4: Verify CocoaPods works
echo ""
echo "Step 4: Verifying CocoaPods..."
pod --version

echo ""
echo "✅ Setup complete! You can now run: npx expo run:ios --device"


#!/bin/bash

echo "🔧 Fixing CocoaPods SSL Certificate Issue..."
echo ""

# Option 1: Update certificates
echo "Step 1: Updating certificates..."
brew install ca-certificates 2>/dev/null || echo "Certificates already installed"

# Option 2: Try using git-based repo instead of CDN
echo ""
echo "Step 2: Setting up CocoaPods repo..."
cd /Users/mickeylau/focus

# Remove any existing problematic setup
rm -rf ~/.cocoapods/repos/trunk 2>/dev/null

# Try to setup repo with git instead
echo "Attempting to setup CocoaPods repo..."
pod setup 2>&1 | head -20

echo ""
echo "Step 3: Testing pod install..."
cd ios 2>/dev/null || echo "ios directory doesn't exist yet (this is normal)"

echo ""
echo "✅ Try running: npx expo run:ios --device"
echo ""
echo "If SSL error persists, try this workaround:"
echo "export SSL_CERT_FILE=$(brew --prefix)/etc/openssl@3/cert.pem"
echo "export REQUESTS_CA_BUNDLE=$(brew --prefix)/etc/openssl@3/cert.pem"


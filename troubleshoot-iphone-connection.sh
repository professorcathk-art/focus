#!/bin/bash

echo "🔧 Troubleshooting iPhone Connection to Xcode..."
echo ""

# Step 1: Check if iPhone is connected
echo "Step 1: Checking USB connection..."
system_profiler SPUSBDataType 2>/dev/null | grep -i "iphone" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ iPhone detected via USB"
else
    echo "❌ iPhone NOT detected via USB"
    echo "   → Make sure iPhone is connected via USB cable"
    echo "   → Try a different USB port or cable"
    exit 1
fi

# Step 2: Check device status
echo ""
echo "Step 2: Checking device status..."
xcrun devicectl list devices 2>&1 | grep -i "iphone" | head -1

# Step 3: Instructions
echo ""
echo "📱 Next Steps:"
echo ""
echo "1. Make sure iPhone is UNLOCKED (not on lock screen)"
echo "2. On iPhone, go to: Settings → General → About"
echo "   → Check iOS version (Developer Mode requires iOS 16+)"
echo ""
echo "3. In Xcode:"
echo "   → Window → Devices and Simulators (Cmd+Shift+2)"
echo "   → Look for your iPhone in the left sidebar"
echo "   → If it says 'Unpaired', click 'Use for Development'"
echo ""
echo "4. If iPhone doesn't appear in Xcode:"
echo "   → Disconnect iPhone"
echo "   → Quit Xcode completely (Cmd+Q)"
echo "   → Reconnect iPhone"
echo "   → Unlock iPhone"
echo "   → Trust computer if prompted"
echo "   → Open Xcode again"
echo ""
echo "5. Alternative: Build for Simulator instead:"
echo "   cd /Users/mickeylau/focus"
echo "   export SSL_CERT_FILE=/opt/homebrew/etc/ca-certificates/cert.pem"
echo "   export REQUESTS_CA_BUNDLE=/opt/homebrew/etc/ca-certificates/cert.pem"
echo "   npx expo run:ios"
echo ""


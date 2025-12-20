#!/bin/bash

echo "🔧 Fixing SSL Certificate Issue for CocoaPods..."
echo ""

# Set SSL certificate paths
export SSL_CERT_FILE=/opt/homebrew/etc/ca-certificates/cert.pem
export REQUESTS_CA_BUNDLE=/opt/homebrew/etc/ca-certificates/cert.pem

echo "SSL certificates configured"
echo ""

# Try to update CocoaPods repo
echo "Updating CocoaPods repo..."
pod repo update 2>&1 | head -20 || echo "Repo update failed, will try during pod install"

echo ""
echo "✅ SSL certificates configured"
echo ""
echo "Now try running:"
echo "export SSL_CERT_FILE=/opt/homebrew/etc/ca-certificates/cert.pem"
echo "export REQUESTS_CA_BUNDLE=/opt/homebrew/etc/ca-certificates/cert.pem"
echo "npx expo run:ios --device"


#!/bin/bash
# EAS Build hook to use npm install instead of npm ci
# This allows legacy-peer-deps to work

set -e

echo "🔧 Using npm install with legacy-peer-deps instead of npm ci"

# Remove node_modules if it exists
if [ -d "node_modules" ]; then
  rm -rf node_modules
fi

# Use npm install with legacy-peer-deps
npm install --legacy-peer-deps

echo "✅ Dependencies installed successfully"


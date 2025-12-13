# Mobile Device Setup Guide

## ⚠️ Important: Network Configuration

When testing on a **physical device** (iPhone/Android), `localhost` won't work because your phone can't access your computer's localhost.

## Solution: Use Your Computer's IP Address

### Step 1: Find Your Computer's IP Address

**On Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Look for something like: 192.168.1.100
```

**Or:**
```bash
ipconfig getifaddr en0
```

**On Windows:**
```bash
ipconfig
# Look for IPv4 Address under your active network adapter
```

### Step 2: Update API URL

**Option A: Set Environment Variable (Recommended)**

Create a `.env` file in the project root:
```env
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:3001/api
```

Replace `YOUR_IP_ADDRESS` with your actual IP (e.g., `192.168.1.100`)

**Option B: Update Code Directly**

Edit `src/config/api.ts` and replace `localhost` with your IP:
```typescript
export const API_BASE_URL = "http://192.168.1.100:3001/api";
```

### Step 3: Make Sure Backend Allows Connections

The backend already has CORS enabled, so it should accept connections from your phone.

### Step 4: Ensure Same Network

- Your computer and phone must be on the **same WiFi network**
- Make sure your firewall isn't blocking port 3001

### Step 5: Test Connection

1. On your phone's browser, try: `http://YOUR_IP:3001/api/health`
2. You should see: `{"status":"ok","timestamp":"..."}`

## Quick Fix for Testing

If you're testing on **iOS Simulator** or **Web**, `localhost` works fine - no changes needed!

Only physical devices need the IP address.


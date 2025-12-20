# Fix iPhone Not Showing in Xcode

## Your iPhone is Connected ✅
Your iPhone is detected via USB, but Xcode can't see it. Here's how to fix it:

## Step-by-Step Fix

### 1. Unlock Your iPhone
- Make sure your iPhone is **unlocked** (not on lock screen)
- Keep it unlocked while connecting

### 2. Trust This Computer
When you connect your iPhone, you should see a popup on your iPhone:
- **"Trust This Computer?"** → Tap **"Trust"**
- Enter your iPhone passcode if prompted

### 3. Open Xcode
1. Open **Xcode** (Applications → Xcode)
2. Go to **Window → Devices and Simulators** (or press `Cmd+Shift+2`)
3. You should see your iPhone in the left sidebar

### 4. If iPhone Shows "Unpaired"
If your iPhone appears but says "Unpaired":
1. Click on your iPhone in the list
2. Click **"Use for Development"** button
3. Wait for pairing to complete

### 5. If iPhone Doesn't Appear at All

**Option A: Restart Connection**
```bash
# Disconnect iPhone from Mac
# Wait 5 seconds
# Reconnect iPhone
# Unlock iPhone
# Trust computer if prompted
```

**Option B: Restart Services**
```bash
# Kill any running Xcode processes
killall Xcode 2>/dev/null
killall com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null

# Restart Xcode
open -a Xcode
```

**Option C: Check Developer Mode**
On your iPhone:
1. Settings → Privacy & Security → Developer Mode
2. Turn ON Developer Mode
3. Restart iPhone if prompted
4. Reconnect to Mac

### 6. Verify Connection
Run this command to check:
```bash
xcrun devicectl list devices
```

You should see your iPhone with **State: "available"** instead of "unavailable"

## Common Issues

### "iPhone is Locked"
- **Fix**: Unlock your iPhone and keep it unlocked

### "iPhone Not Trusted"
- **Fix**: On iPhone, tap "Trust" when prompted, or go to Settings → General → VPN & Device Management → Trust

### "Developer Mode Disabled"
- **Fix**: Settings → Privacy & Security → Developer Mode → Turn ON

### "Xcode Can't Find iPhone"
- **Fix**: Make sure you're using a **USB cable** (not wireless)
- Try a different USB port
- Try a different USB cable

## After Fixing

Once your iPhone shows as "available" in Xcode:
```bash
cd /Users/mickeylau/focus
export SSL_CERT_FILE=/opt/homebrew/etc/ca-certificates/cert.pem
export REQUESTS_CA_BUNDLE=/opt/homebrew/etc/ca-certificates/cert.pem
npx expo run:ios --device
```


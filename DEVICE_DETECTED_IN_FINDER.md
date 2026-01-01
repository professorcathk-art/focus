# Device Detected in Finder But Not Xcode

## ✅ **Good News: Device IS Connected!**

If Finder can see your iPhone, the USB connection is working perfectly. The issue is that **Xcode isn't detecting it for development**.

---

## 🔧 **Quick Fix Steps**

### Step 1: Enable Developer Mode on iPhone

**This is the most common issue!**

1. On your iPhone, go to **Settings** → **Privacy & Security**
2. Scroll down to find **Developer Mode**
3. If you don't see it:
   - Connect iPhone to Mac
   - Open Xcode
   - Try to build/run any project (or just open Xcode)
   - Then check Settings again - Developer Mode should appear
4. Toggle **Developer Mode** ON
5. iPhone will restart
6. After restart, confirm you want to enable Developer Mode

### Step 2: Trust Computer for Development

1. Make sure iPhone is **unlocked**
2. Connect iPhone to Mac
3. On iPhone, you should see: **"Trust This Computer?"**
4. Tap **"Trust"**
5. Enter your iPhone passcode

### Step 3: Check Xcode Devices Window

1. Open **Xcode**
2. Go to **Window** → **Devices and Simulators** (`Cmd+Shift+2`)
3. Look for your iPhone in the left sidebar
4. If it shows but says "Unavailable":
   - Click on your device
   - Read the error message
   - Usually says "Developer Mode disabled" or "Device not trusted"

---

## 🚀 **Alternative: Use Expo CLI Directly**

Since Finder can see your device, Expo CLI might be able to detect it even if Xcode doesn't show it:

```bash
cd /Users/mickeylau/focus

# List available devices
npx expo run:ios --device

# Or specify device by name
npx expo run:ios --device "Your iPhone Name"
```

Expo CLI uses different methods to detect devices and might work even when Xcode doesn't show them.

---

## 🔍 **Check Device Status**

Run this command to see what Xcode can detect:

```bash
xcrun xctrace list devices
```

This will show:
- All connected devices
- Their status (Ready, Unavailable, etc.)
- Any error messages

---

## 📱 **What to Look For**

When you check **Settings** → **Privacy & Security** on your iPhone:

- ✅ **Developer Mode** should be visible
- ✅ **Developer Mode** should be **ON** (green toggle)
- ✅ If it's OFF, toggle it ON and restart iPhone

---

## 🎯 **Most Likely Issue**

Since Finder can see your device but Xcode can't:

**99% chance it's Developer Mode not enabled!**

iOS 16+ requires Developer Mode to be enabled for Xcode to detect devices for development. Finder doesn't need Developer Mode, which is why Finder can see it but Xcode can't.

---

## ✅ **After Enabling Developer Mode**

1. iPhone restarts
2. Confirm Developer Mode when prompted
3. Open Xcode → Devices and Simulators
4. Your iPhone should now appear
5. Status should show: **"Ready for development"**

---

**Next Steps:**
1. Enable Developer Mode on iPhone
2. Restart iPhone
3. Check Xcode Devices window again
4. If still not working, try Expo CLI: `npx expo run:ios --device`


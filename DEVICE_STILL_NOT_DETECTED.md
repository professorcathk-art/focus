# Device Still Not Detected After Enabling Developer Mode

## ✅ **You've Already Done:**
- ✅ Enabled Developer Mode
- ✅ Trusted computer
- ✅ Checked Xcode Devices window

But device still shows as "Unknown" and "Offline". Let's try more advanced troubleshooting.

---

## 🔧 **Additional Troubleshooting Steps**

### Step 1: Restart Xcode and Services

```bash
# Kill all Xcode processes
killall Xcode
killall com.apple.CoreSimulator.CoreSimulatorService

# Restart your Mac (optional but sometimes helps)
```

### Step 2: Check Xcode Preferences

1. Open **Xcode**
2. Go to **Xcode** → **Settings** (or **Preferences**)
3. Go to **Platforms** tab
4. Check if iOS platform is installed and up to date
5. If not, click **"Get"** or **"Update"**

### Step 3: Check iOS Version Compatibility

- Make sure your iPhone iOS version is **supported** by your Xcode version
- Xcode 26.2 should support iOS 18.x
- If your iPhone is on a newer iOS version, you might need to update Xcode

### Step 4: Try Expo CLI Directly

Expo CLI might detect your device even if Xcode doesn't:

```bash
cd /Users/mickeylau/focus
npx expo run:ios --device
```

This will:
- Show you a list of available devices
- Let you select your iPhone
- Build and install directly

### Step 5: Check Device UDID Manually

1. In Finder, click on your iPhone
2. Look at the device info (should show iOS version, capacity, etc.)
3. Note the device name

Then try:
```bash
npx expo run:ios --device "Your iPhone Name"
```

### Step 6: Reset Device Pairing

Sometimes the device pairing gets corrupted:

1. **Disconnect** iPhone from Mac
2. In Xcode: **Window** → **Devices and Simulators**
3. If your device appears (even as "Unavailable"), right-click it
4. Select **"Unpair"** or **"Remove"**
5. **Reconnect** iPhone to Mac
6. **Trust** computer again
7. Check Devices window again

### Step 7: Check USB Connection Mode

On your iPhone:
1. Go to **Settings** → **General** → **AirPlay & Handoff**
2. Make sure **Handoff** is enabled
3. Also check: **Settings** → **General** → **AirDrop** → Make sure it's not set to "Receiving Off"

### Step 8: Try Different USB Port/Cable

- Try a **different USB port** on your Mac
- Try a **different USB cable** (some cables are charge-only)
- Make sure you're using a **data-capable USB cable**

---

## 🚀 **Alternative: Use Expo Development Build**

If Xcode still can't detect your device, you can use Expo's development build:

```bash
# Build development client
npx expo run:ios --device

# Or use EAS Build (when quota resets)
eas build --profile development --platform ios
```

Then install the development build on your iPhone and use Expo Go or the development client.

---

## 🔍 **Check What Expo CLI Sees**

Run this to see what devices Expo can detect:

```bash
cd /Users/mickeylau/focus
npx expo run:ios --device --help
npx expo run:ios --device
```

This will show you a list of devices Expo can see, which might be different from what Xcode shows.

---

## 📱 **What iOS Version Are You On?**

Check your iPhone:
- **Settings** → **General** → **About** → **iOS Version**

If it's iOS 18.x or newer, make sure Xcode 26.2 supports it. You might need to:
- Update Xcode to latest version
- Or wait for Xcode update if your iOS is too new

---

## 🎯 **Most Likely Solutions**

1. **Restart Xcode** completely (quit and reopen)
2. **Unpair and re-pair** device in Xcode Devices window
3. **Use Expo CLI directly** - it might work even if Xcode doesn't show device
4. **Check iOS/Xcode version compatibility**

---

## ✅ **Quick Test**

Try this command - it will show you what Expo CLI can detect:

```bash
cd /Users/mickeylau/focus
npx expo run:ios --device
```

If Expo CLI can see your device, you can build directly without needing Xcode to show it!


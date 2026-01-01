# Fix: iPhone Not Showing in Xcode

## Issue: Device Not Found in Xcode

This is **NOT** related to M1 Macs - M1 Macs work perfectly with iOS devices. The issue is usually one of these:

---

## ✅ **Step-by-Step Fix**

### 1. **Check Physical Connection**
- ✅ Use a **USB cable** (not wireless)
- ✅ Try a **different USB port** on your Mac
- ✅ Try a **different USB cable** (some cables are charge-only)
- ✅ Make sure cable is **fully plugged in** on both ends

### 2. **Unlock and Trust Your iPhone**
- ✅ **Unlock your iPhone** (enter passcode)
- ✅ When you connect, iPhone should show: **"Trust This Computer?"**
- ✅ Tap **"Trust"** on your iPhone
- ✅ Enter your iPhone passcode to confirm

### 3. **Enable Developer Mode (iOS 16+)**
If your iPhone is running iOS 16 or later:

1. Go to **Settings** → **Privacy & Security**
2. Scroll down to **Developer Mode**
3. Toggle **Developer Mode** ON
4. iPhone will restart
5. After restart, confirm you want to enable Developer Mode

**Note:** If you don't see "Developer Mode" option:
- Connect your iPhone to Mac first
- Open Xcode
- Try to build/run a project
- Then check Settings again

### 4. **Check Xcode Devices Window**
1. Open **Xcode**
2. Go to **Window** → **Devices and Simulators** (or press `Cmd+Shift+2`)
3. Check if your iPhone appears in the left sidebar
4. If it shows but is "Unavailable":
   - Click on your device
   - Check the error message
   - Usually says "Developer Mode disabled" or "Device not trusted"

### 5. **Restart Everything**
1. **Disconnect** iPhone from Mac
2. **Quit Xcode** completely (`Cmd+Q`)
3. **Restart your Mac** (optional but sometimes helps)
4. **Restart your iPhone** (hold power button + volume down)
5. **Reconnect** iPhone to Mac
6. **Open Xcode** again
7. Check Devices window again

### 6. **Check Xcode Version**
- Make sure you have **latest Xcode** installed
- Older Xcode versions may not support newer iOS versions
- Check: **Xcode** → **About Xcode** (should be 14.0+)

### 7. **Check iOS Version**
- Make sure your iPhone iOS version is **supported** by your Xcode version
- Xcode 15.x supports iOS 17.x
- Xcode 14.x supports iOS 16.x
- If mismatch, update Xcode or use compatible iOS version

---

## 🔍 **Diagnostic Commands**

Run these in Terminal to check device connection:

```bash
# Check if device is detected by system
system_profiler SPUSBDataType | grep -A 10 "iPhone\|iPad"

# Check if Xcode can see device
xcrun xctrace list devices

# Check if device is trusted
idevice_id -l
```

If `idevice_id` command not found, install libimobiledevice:
```bash
brew install libimobiledevice
```

---

## 🚨 **Common Error Messages**

### "Developer Mode is disabled"
**Fix:** Enable Developer Mode in Settings → Privacy & Security → Developer Mode

### "Device not trusted"
**Fix:** 
1. Disconnect iPhone
2. Reconnect iPhone
3. Tap "Trust" when prompted
4. Enter passcode

### "Device unavailable"
**Fix:**
1. Unlock iPhone
2. Make sure iPhone is not in Low Power Mode
3. Restart iPhone
4. Reconnect to Mac

### "This device is not supported"
**Fix:**
- Update Xcode to latest version
- Check iOS version compatibility

---

## ✅ **Verify It's Working**

After following steps above:

1. Open **Xcode**
2. Go to **Window** → **Devices and Simulators**
3. Your iPhone should appear in left sidebar
4. Status should show: **"Ready for development"**
5. You should see device info (iOS version, UDID, etc.)

---

## 🎯 **Alternative: Use Expo CLI**

If Xcode still doesn't detect device, you can use Expo CLI directly:

```bash
# Make sure device is connected and trusted
npx expo run:ios --device

# Or specify device by name
npx expo run:ios --device "Your iPhone Name"
```

Expo CLI can sometimes detect devices even when Xcode doesn't show them.

---

## 📝 **M1 Mac Specific Notes**

**M1 Macs work perfectly with iOS devices!** There are no compatibility issues.

If you're having issues, it's **NOT** because of M1 - it's one of the common issues above:
- Device not trusted
- Developer Mode disabled
- USB connection issue
- Xcode version mismatch

---

## 🆘 **Still Not Working?**

1. **Check Apple Developer Forums** for your specific error
2. **Update macOS** to latest version
3. **Update Xcode** to latest version
4. **Update iOS** on your iPhone
5. **Try different Mac** (if available) to isolate issue

---

**Last Updated:** 2025-12-21


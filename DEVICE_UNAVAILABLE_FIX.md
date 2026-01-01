# Fix: Device Shows as "Unavailable" - Complete Solution

## 🔴 **Current Status:**
- ✅ Device detected: iPhone16,2
- ✅ UDID: `040B92B1-5AEF-58C7-8F6E-8CA149EC411A`
- ❌ State: **unavailable**
- ❌ Expo CLI error: "Unexpected devicectl JSON version"

---

## 🎯 **Root Cause:**

The device is showing as "unavailable" which prevents Expo/Xcode from using it. This usually happens when:

1. **Device is locked** (most common)
2. **Developer Mode not fully activated**
3. **Device needs to be re-paired**
4. **iOS/Xcode version mismatch**

---

## ✅ **Complete Fix Steps:**

### Step 1: Ensure iPhone is Unlocked and Stay Unlocked

**CRITICAL:** Keep your iPhone **unlocked** during the entire process:

1. **Unlock your iPhone** (enter passcode)
2. **Disable auto-lock temporarily:**
   - Settings → Display & Brightness → Auto-Lock → **Never**
3. **Keep iPhone unlocked** while connected

### Step 2: Re-pair Device in Xcode

1. **Open Xcode**
2. **Window** → **Devices and Simulators** (`Cmd+Shift+2`)
3. If your iPhone appears (even as "Unavailable"):
   - **Right-click** on your iPhone
   - Select **"Unpair"** or **"Remove"**
4. **Disconnect** iPhone from Mac
5. **Wait 10 seconds**
6. **Reconnect** iPhone to Mac
7. **Unlock iPhone** (if it locked)
8. **Tap "Trust This Computer"** when prompted
9. **Enter iPhone passcode**
10. Check Xcode Devices window again

### Step 3: Verify Developer Mode

1. On iPhone: **Settings** → **Privacy & Security** → **Developer Mode**
2. Make sure it's **ON** (green toggle)
3. If it was just enabled, **restart iPhone** again
4. After restart, **confirm** Developer Mode when prompted

### Step 4: Check iOS/Xcode Compatibility

Your iPhone is **iPhone16,2** (iPhone 16 Pro), which likely runs **iOS 18.x**.

Make sure:
- **Xcode 26.2** supports iOS 18.x
- If not, you may need to update Xcode or wait for update

### Step 5: Try Building Again

After completing steps above:

```bash
cd /Users/mickeylau/focus

# Try with UDID
npx expo run:ios --device 040B92B1-5AEF-58C7-8F6E-8CA149EC411A

# Or try without specifying device (let Expo detect)
npx expo run:ios --device
```

---

## 🔧 **Alternative: Fix devicectl Issue**

The "Unexpected devicectl JSON version" error suggests a compatibility issue. Try:

```bash
# Update Xcode Command Line Tools
sudo xcode-select --install

# Reset Xcode developer directory
sudo xcode-select --reset
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Restart your Mac
```

---

## 🚀 **Workaround: Use EAS Build (When Quota Resets)**

If local build still doesn't work, wait 10 days for EAS Build quota reset (January 1, 2026):

```bash
# Build development client
eas build --profile development --platform ios

# Then install on iPhone via TestFlight or direct download
```

---

## 📋 **Checklist Before Building:**

- [ ] iPhone is **unlocked**
- [ ] Auto-lock is **disabled** (set to Never)
- [ ] iPhone is **trusted** on Mac
- [ ] **Developer Mode** is ON and confirmed after restart
- [ ] Device is **re-paired** in Xcode (unpaired and re-paired)
- [ ] Xcode shows device (even if "Unavailable")
- [ ] USB cable is **data-capable** (not charge-only)
- [ ] Using **data USB port** (not just charging port)

---

## 🎯 **Most Likely Fix:**

**Keep iPhone unlocked + Re-pair device in Xcode**

This combination fixes 90% of "unavailable" device issues.

---

## ✅ **Test After Fix:**

```bash
cd /Users/mickeylau/focus

# Check device status
xcrun devicectl list devices

# Should show State: "available" instead of "unavailable"

# Then try build
npx expo run:ios --device 040B92B1-5AEF-58C7-8F6E-8CA149EC411A
```

---

**Next Steps:**
1. Keep iPhone unlocked
2. Re-pair device in Xcode
3. Try build again


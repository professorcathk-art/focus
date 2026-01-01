# Fix: "No iOS devices available in Simulator.app"

## ❌ **Error:**
```
CommandError: No iOS devices available in Simulator.app
```

This means Expo CLI is trying to use the iOS Simulator instead of your physical iPhone.

---

## ✅ **Solution: Specify Physical Device**

### Option 1: Use Device UDID (Most Reliable)

Your iPhone UDID is: `040B92B1-5AEF-58C7-8F6E-8CA149EC411A`

```bash
cd /Users/mickeylau/focus
npx expo run:ios --device 040B92B1-5AEF-58C7-8F6E-8CA149EC411A
```

### Option 2: Use Device Name

First, find your device name:
- In Finder, click on your iPhone
- Note the device name (e.g., "Mickey's iPhone")

Then run:
```bash
cd /Users/mickeylau/focus
npx expo run:ios --device "Mickey's iPhone"
```

### Option 3: List Available Devices First

```bash
cd /Users/mickeylau/focus

# This will show you available devices and let you select
npx expo run:ios --device
```

When prompted, select your physical iPhone from the list.

---

## 🔧 **If Device Still Shows as "Unavailable"**

Even if Xcode shows device as "unavailable", Expo CLI might still work. Try:

1. **Make sure iPhone is unlocked**
2. **Keep iPhone unlocked** during the build process
3. **Disable auto-lock** temporarily:
   - Settings → Display & Brightness → Auto-Lock → Never

4. **Try the build again:**
```bash
cd /Users/mickeylau/focus
npx expo run:ios --device 040B92B1-5AEF-58C7-8F6E-8CA149EC411A
```

---

## 🚨 **Alternative: Wait for EAS Build Quota Reset**

If local build doesn't work, you can wait 10 days for EAS Build quota to reset (January 1, 2026), then use:

```bash
eas build --profile development --platform ios
```

This will build in the cloud and you can install via TestFlight or direct download.

---

## 📱 **Quick Test**

Try this command with your device UDID:

```bash
cd /Users/mickeylau/focus
npx expo run:ios --device 040B92B1-5AEF-58C7-8F6E-8CA149EC411A
```

This should bypass the Simulator and build directly to your iPhone!

---

**Note:** Make sure your iPhone is:
- ✅ Unlocked
- ✅ Developer Mode enabled
- ✅ Trusted computer
- ✅ Connected via USB


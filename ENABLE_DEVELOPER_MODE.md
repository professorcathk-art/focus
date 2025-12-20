# Enable Developer Mode on iPhone

## Why Developer Mode is Required

When you install an app from EAS Build (not from App Store), iOS requires **Developer Mode** to be enabled. This is a security feature that allows you to run apps from untrusted developers.

## How to Enable Developer Mode

### Step 1: Open Settings
1. Open the **Settings** app on your iPhone

### Step 2: Navigate to Privacy & Security
1. Scroll down and tap **Privacy & Security**

### Step 3: Enable Developer Mode
1. Scroll down to find **Developer Mode**
2. Toggle **Developer Mode** to **ON**
3. Your iPhone will prompt you to restart

### Step 4: Restart iPhone
1. Tap **Restart** when prompted
2. Wait for your iPhone to restart

### Step 5: Confirm Developer Mode
1. After restart, you'll see a popup asking to confirm Developer Mode
2. Tap **Turn On**
3. Enter your iPhone passcode if prompted

## After Enabling Developer Mode

1. **Open the Focus app** from your home screen
2. If you see a warning about "Untrusted Developer":
   - Go to **Settings → General → VPN & Device Management**
   - Tap on the developer certificate (should show your Apple ID or "Expo")
   - Tap **Trust**
   - Tap **Trust** again to confirm

3. **The app should now launch!** ✅

## Troubleshooting

### "Developer Mode" Option Not Showing
- **Cause**: Developer Mode only appears on iOS 16+ after installing a development build
- **Fix**: Make sure you're on iOS 16 or later
- If you're on iOS 15 or earlier, Developer Mode doesn't exist - just trust the developer certificate

### "Untrusted Developer" Error
- **Fix**: Go to Settings → General → VPN & Device Management → Trust the developer

### App Still Won't Open
- Make sure Developer Mode is enabled AND you've trusted the developer certificate
- Try restarting your iPhone again
- Uninstall and reinstall the app

## What is Developer Mode?

Developer Mode is a security feature introduced in iOS 16 that:
- Allows you to install and run apps from untrusted sources (like EAS Build)
- Requires explicit user consent
- Can be disabled at any time in Settings

**Note**: Developer Mode is different from being a registered Apple Developer. You don't need a paid developer account to enable Developer Mode on your own device.

## Security Note

Developer Mode is safe to enable on your own device. It only affects apps you install outside the App Store. It doesn't:
- Give apps special permissions
- Bypass iOS security features
- Allow apps to access more data than normal

---

**Once Developer Mode is enabled and the developer is trusted, your app should work perfectly!** 🎉


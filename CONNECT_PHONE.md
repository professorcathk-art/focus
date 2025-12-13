# Connect Your Phone to Expo

## Your Connection Info:
- **Local IP**: 192.168.0.223
- **Port**: 8081
- **Expo URL**: `exp://192.168.0.223:8081`

## Method 1: Manual Connection (Easiest)

1. **Install Expo Go** from the App Store (if not already installed)

2. **Open Expo Go** on your iPhone

3. **Tap "Enter URL manually"** (or look for "Connection" option)

4. **Enter this URL:**
   ```
   exp://192.168.0.223:8081
   ```

5. **Tap "Connect"**

6. The Focus app should load!

## Method 2: QR Code (If you can see terminal)

1. Make sure your Mac and iPhone are on the **same WiFi network**

2. In your terminal, run:
   ```bash
   npx expo start
   ```

3. Look for the QR code in the terminal output

4. Open **Camera app** on iPhone (not Expo Go)

5. Point camera at QR code in terminal

6. Tap the notification that appears

7. It will open in Expo Go automatically

## Troubleshooting

**"Unable to connect" error:**
- Make sure Mac and iPhone are on same WiFi
- Check that firewall isn't blocking port 8081
- Try restarting Expo: `pkill -f "expo start" && npx expo start`

**Can't see QR code:**
- Use Method 1 (manual connection) instead
- Or check terminal window where `npx expo start` is running

**Connection works but app doesn't load:**
- Check terminal for error messages
- Try clearing cache: `npx expo start --clear`


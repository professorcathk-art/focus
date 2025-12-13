# Troubleshooting Expo Go Connection

## Current Status
✅ Expo server is running on port 8081
✅ SDK 54 is installed
⚠️ Connection issue: "unknown error cannot connect to server"

## Solutions to Try

### Solution 1: Use Tunnel Mode (Recommended)
Tunnel mode works even if your phone and Mac are on different networks:

1. **Stop the current server** (Ctrl+C in terminal)

2. **Start with tunnel mode:**
   ```bash
   npx expo start --tunnel
   ```

3. **Wait for the QR code** - it will show a `exp://` URL

4. **Scan with Expo Go** - tunnel URLs work from anywhere

### Solution 2: Check Network Connection

1. **Verify same WiFi:**
   - Mac and iPhone must be on the **same WiFi network**
   - Check WiFi name matches on both devices

2. **Check firewall:**
   - Mac System Settings → Network → Firewall
   - Make sure port 8081 is not blocked
   - Or temporarily disable firewall to test

3. **Try manual connection:**
   - In Expo Go, tap "Enter URL manually"
   - Enter: `exp://192.168.0.223:8081`
   - (Replace with your Mac's IP if different)

### Solution 3: Restart Everything

1. **Stop Expo server:** Ctrl+C in terminal

2. **Clear cache and restart:**
   ```bash
   npx expo start --clear
   ```

3. **Restart Expo Go app** on your phone

4. **Try connecting again**

### Solution 4: Check for Errors

1. **Look at terminal output** when you try to connect
2. **Check Expo Go app** for specific error messages
3. **Look for red error screens** in the app

### Solution 5: Use Development Build (Advanced)

If Expo Go keeps having issues, you can create a development build:

```bash
npx expo run:ios
```

This builds the app directly on your phone (requires Xcode).

---

## Quick Test: Web Version

To verify the app code works, test in browser first:

```bash
npx expo start --web
```

Then open `http://localhost:8081` in your browser.

If web works but phone doesn't, it's a network/connection issue, not code.

---

## Most Common Issues

1. **Different WiFi networks** - Most common!
2. **Firewall blocking port 8081**
3. **Corporate/school WiFi** blocking connections
4. **VPN active** on either device

---

## Next Steps

Try **Solution 1 (Tunnel Mode)** first - it's the most reliable!


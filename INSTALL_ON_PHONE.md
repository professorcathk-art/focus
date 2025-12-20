# How to Install App on Your iPhone

## 🎯 Two Options

### Option 1: Local Build (Faster, Requires Xcode) ⚡
Build directly on your Mac and install on your iPhone.

### Option 2: EAS Build (Easier, Cloud Build) ☁️
Build in the cloud and install via TestFlight or direct download.

---

## Option 1: Local Build (Recommended for Testing)

### Prerequisites
- ✅ Xcode installed (from Mac App Store - free)
- ✅ Apple Developer Account ($99/year) - **Required for Apple Sign-In**
- ✅ iPhone connected via USB cable
- ✅ iPhone unlocked and trusted

### Step-by-Step

#### Step 1: Connect Your iPhone

1. **Connect iPhone to Mac** with USB cable
2. **Unlock iPhone** and tap "Trust This Computer" if prompted
3. **Verify connection**:
   ```bash
   xcrun devicectl list devices
   ```
   You should see your iPhone listed

#### Step 2: Configure Xcode Signing

1. **Open Xcode** (if not already open)
2. **Xcode → Settings → Accounts**
3. **Add your Apple ID** (if not already added)
4. **Select your Apple ID** → Click "Download Manual Profiles"
5. **Close Settings**

#### Step 3: Build and Install

Run this command in your project directory:

```bash
cd /Users/mickeylau/focus
npx expo run:ios --device
```

**What happens:**
1. Expo will ask you to select a device - **choose your iPhone**
2. Xcode will open automatically
3. First build takes **10-15 minutes** (subsequent builds are faster)
4. App will automatically install on your iPhone
5. You may need to **trust the developer** on your iPhone:
   - Settings → General → VPN & Device Management
   - Tap your developer certificate
   - Tap "Trust"

#### Step 4: Run the App

1. **Find the app** on your iPhone home screen (named "Focus")
2. **Tap to open**
3. **If prompted**: Settings → General → VPN & Device Management → Trust developer
4. **App should launch** ✅

---

## Option 2: EAS Build (Cloud Build)

### Prerequisites
- ✅ Expo account (free - sign up at expo.dev)
- ✅ Apple Developer Account ($99/year)
- ✅ EAS CLI installed

### Step-by-Step

#### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

#### Step 2: Login to Expo

```bash
eas login
```

Enter your Expo account credentials (create one at expo.dev if needed)

#### Step 3: Configure EAS Build

```bash
cd /Users/mickeylau/focus
eas build:configure
```

This creates `eas.json` configuration file.

#### Step 4: Build for iOS

```bash
eas build --platform ios --profile development
```

**What happens:**
1. EAS uploads your code to their servers
2. Builds the app in the cloud (takes 15-20 minutes)
3. Provides a download link when complete

#### Step 5: Install on iPhone

**Option A: Via TestFlight (Recommended)**
1. EAS will ask if you want to submit to TestFlight
2. Say **yes**
3. Wait for Apple to process (usually 10-30 minutes)
4. Open **TestFlight** app on your iPhone
5. Install the app from TestFlight

**Option B: Direct Install**
1. EAS provides a download link
2. Open the link on your iPhone
3. Tap "Install" when prompted
4. Trust the developer (Settings → General → VPN & Device Management)

---

## 🔄 Development Workflow

### After Installing Development Build

Once installed, you can use **Expo Dev Client** for faster iteration:

1. **Start Expo server**:
   ```bash
   npx expo start --dev-client
   ```

2. **Open the app** on your iPhone (the one you just installed)

3. **Shake your device** or press `Cmd+D` (if connected) to open developer menu

4. **Select "Enter URL manually"**

5. **Enter your Mac's IP**:
   ```
   exp://192.168.0.223:8081
   ```
   (Replace with your actual IP address)

6. **App reloads** with your latest code changes ✅

**Benefits:**
- ✅ Fast hot reload (like Expo Go)
- ✅ Uses your bundle ID (`com.focuscircle`)
- ✅ Apple Sign-In works correctly
- ✅ All native features work

---

## 🐛 Troubleshooting

### "No devices found"
- Make sure iPhone is connected via USB
- Unlock iPhone
- Trust the computer if prompted
- Try: `xcrun devicectl list devices`

### "Signing certificate not found"
- Open Xcode → Settings → Accounts
- Add your Apple ID
- Download manual profiles
- Try building again

### "App won't open after install"
- Settings → General → VPN & Device Management
- Tap your developer certificate
- Tap "Trust"
- Try opening app again

### "Build fails with code signing error"
- Make sure you have Apple Developer account
- Verify bundle ID `com.focuscircle` matches Apple Developer Portal
- Check Xcode → Settings → Accounts → Download Manual Profiles

### "EAS build fails"
- Make sure you're logged in: `eas login`
- Check `eas.json` configuration
- Verify Apple Developer account is linked to Expo account

---

## 📱 Quick Comparison

| Method | Speed | Setup | Apple Sign-In | Best For |
|--------|-------|-------|---------------|----------|
| **Local Build** | ⚡ Fast (after first build) | Medium | ✅ Works | Daily development |
| **EAS Build** | 🐌 Slower (cloud) | Easy | ✅ Works | Sharing with team |
| **Expo Go** | ⚡ Fastest | Easiest | ❌ Doesn't work | Testing other features |

---

## ✅ Recommended Approach

1. **For daily development**: Use **Local Build** (`npx expo run:ios --device`)
2. **For testing Apple Sign-In**: Use **Local Build** or **EAS Build**
3. **For quick UI testing**: Use **Expo Go** (but skip Apple Sign-In)

---

## 🚀 Quick Start Command

**To install on your iPhone right now:**

```bash
cd /Users/mickeylau/focus
npx expo run:ios --device
```

**Make sure:**
- ✅ iPhone connected via USB
- ✅ iPhone unlocked
- ✅ Xcode installed
- ✅ Apple Developer account configured

The app will build and install automatically! 🎉



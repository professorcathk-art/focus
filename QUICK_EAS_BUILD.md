# Quick EAS Build - Install on iPhone Without Local Connection

## Why EAS Build?
- ✅ No need to connect iPhone to Mac
- ✅ No Developer Mode required
- ✅ Works even if Xcode can't see your device
- ✅ Builds in the cloud (15-20 minutes)

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

(Create account at expo.dev if needed - it's free)

## Step 3: Configure EAS

```bash
cd /Users/mickeylau/focus
eas build:configure
```

This creates `eas.json` configuration file.

## Step 4: Build for iOS

```bash
eas build --platform ios --profile development
```

**What happens:**
1. EAS uploads your code to their servers
2. Builds the app in the cloud (15-20 minutes)
3. Provides a download link when complete

## Step 5: Install on iPhone

**Option A: Direct Install**
1. EAS provides a download link
2. Open the link on your iPhone (Safari)
3. Tap "Install" when prompted
4. Go to Settings → General → VPN & Device Management
5. Tap the developer certificate → Trust
6. Open the app from home screen

**Option B: TestFlight (Recommended)**
1. When build completes, EAS asks if you want to submit to TestFlight
2. Say **yes**
3. Wait for Apple to process (10-30 minutes)
4. Open **TestFlight** app on your iPhone
5. Install the app from TestFlight

## Benefits of EAS Build

- ✅ No local device connection needed
- ✅ Works with any iPhone (even if Xcode can't see it)
- ✅ TestFlight makes it easy to install updates
- ✅ Can share with testers easily

## Quick Start Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
cd /Users/mickeylau/focus
eas build:configure

# Build
eas build --platform ios --profile development
```

That's it! 🎉


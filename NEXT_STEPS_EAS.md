# Next Steps After Installing EAS CLI

## Step 1: Install EAS CLI

Run this command in your terminal (you'll be prompted for your password):

```bash
sudo npm install -g eas-cli
```

## Step 2: Verify Installation

Check that EAS CLI is installed:

```bash
eas --version
```

You should see something like: `eas-cli/x.x.x`

## Step 3: Login to Expo

```bash
eas login
```

- If you don't have an Expo account, create one at https://expo.dev
- Enter your email and password when prompted

## Step 4: Initialize EAS in Your Project

```bash
cd /Users/mickeylau/focus
eas init
```

This will:
- Link your project to Expo
- Ask if you want to set up EAS Build (say yes)
- Configure your project

## Step 5: Build Your App

### For Testing (Preview Builds)

**iOS Simulator:**
```bash
eas build --platform ios --profile preview
```

**Android APK (for testing on device):**
```bash
eas build --platform android --profile preview
```

### For Production (App Store/Play Store)

**iOS:**
```bash
eas build --platform ios --profile production
```
⚠️ Requires Apple Developer account ($99/year)

**Android:**
```bash
eas build --platform android --profile production
```
⚠️ Requires Google Play Developer account ($25 one-time)

## Step 6: Monitor Build Progress

After starting a build, you'll see:
- A build URL to monitor progress
- Estimated build time (usually 10-20 minutes)

Check build status:
```bash
eas build:list
```

## Step 7: Download Your Build

Once complete:
1. Visit the build URL provided
2. Or go to https://expo.dev → Your Project → Builds
3. Download the `.ipa` (iOS) or `.apk`/`.aab` (Android)

## Troubleshooting

### "Command not found: eas"
- Make sure installation completed successfully
- Try: `which eas` to verify installation path
- Restart your terminal

### "Not logged in"
- Run: `eas login`
- Create account at https://expo.dev if needed

### Build fails
- Check build logs: `eas build:view [build-id]`
- Verify `eas.json` is correct
- Check that environment variables are set

## What's Already Configured

✅ `eas.json` - Build configuration with production environment variables
✅ `app.json` - Updated with build numbers and package names
✅ Environment variables - Pointing to your Vercel backend

## Quick Reference

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Cancel a build
eas build:cancel [build-id]

# Configure credentials
eas credentials

# Submit to App Store/Play Store
eas submit --platform ios
eas submit --platform android
```

## Need Help?

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Expo Dashboard: https://expo.dev
- EAS Build Guide: See `EAS_BUILD_GUIDE.md`


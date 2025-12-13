# Building for Physical iOS Devices

## The Issue

The previous build was configured for **iOS Simulator only**, which can't be installed on physical devices. To install on your iPhone, you need a build configured for physical devices.

## Requirements

**For Physical Device Builds:**
- ✅ Apple Developer Account ($99/year)
- ✅ Code signing certificates (EAS can manage these automatically)

## Options

### Option 1: Set Up Credentials (Interactive Mode)

Run this command **without** `--non-interactive`:

```bash
eas build --platform ios --profile preview
```

EAS will guide you through:
1. Setting up Apple Developer account
2. Creating certificates automatically
3. Building for your device

**Note:** You'll need to enter your Apple ID and password.

### Option 2: Use TestFlight (Recommended for Distribution)

TestFlight allows you to distribute your app to testers without App Store approval:

```bash
# Build for production
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios
```

**Benefits:**
- Easy distribution to testers
- No need to manually install on each device
- TestFlight handles code signing

### Option 3: Development Build with Expo Go

For development/testing, you can use Expo Go:

1. **Keep using Expo Go** (current setup)
2. **Or build a development client:**

```bash
eas build --platform ios --profile development
```

This creates a custom Expo Go with your native modules.

## Quick Start: Set Up Credentials

1. **Run interactive build:**
   ```bash
   eas build --platform ios --profile preview
   ```

2. **Follow prompts:**
   - Enter your Apple ID
   - EAS will create certificates automatically
   - Build will proceed

3. **Install on device:**
   - Scan QR code or visit download link
   - Trust the developer certificate on your iPhone:
     - Settings → General → VPN & Device Management
     - Trust the developer certificate

## Troubleshooting

### "Unable to install Focus"
- **Cause:** Build was for simulator, not device
- **Fix:** Build with credentials (Option 1 or 2)

### "Untrusted Developer"
- **Cause:** Device doesn't trust the certificate
- **Fix:** Settings → General → VPN & Device Management → Trust

### "No Apple Developer Account"
- **Options:**
  1. Sign up at https://developer.apple.com ($99/year)
  2. Use TestFlight (requires Apple Developer account)
  3. Use Expo Go for development (free, but limited)

## Current Configuration

Your `eas.json` preview profile is now configured for physical devices (simulator flag removed).

## Next Steps

Choose one:
1. **Set up credentials now:** `eas build --platform ios --profile preview`
2. **Use TestFlight:** Build production and submit
3. **Continue with Expo Go:** For development


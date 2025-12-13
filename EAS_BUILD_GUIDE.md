# EAS Build Guide - Building Production Mobile Apps

This guide will help you build native iOS and Android apps for production using Expo Application Services (EAS Build).

## Prerequisites

1. **Expo Account**: Sign up at https://expo.dev (free)
2. **EAS CLI**: Install the EAS CLI tool
3. **Apple Developer Account** (for iOS): $99/year - required for App Store
4. **Google Play Developer Account** (for Android): $25 one-time - required for Play Store

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

Enter your Expo account credentials (or create an account if you don't have one).

## Step 3: Configure EAS Build

Initialize EAS Build configuration:

```bash
eas build:configure
```

This will create an `eas.json` file in your project root.

## Step 4: Update eas.json Configuration

The generated `eas.json` will look something like this. Update it for your needs:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://focus-psi-one.vercel.app/api"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Important**: Make sure `EXPO_PUBLIC_API_URL` is set in the production build environment!

## Step 5: Update app.json

Ensure your `app.json` has proper configuration:

```json
{
  "expo": {
    "name": "Focus",
    "slug": "focus",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.focus.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.focus.app",
      "versionCode": 1
    }
  }
}
```

## Step 6: Build for iOS

### 6.1 First Time Setup (iOS)

1. **Create Apple Developer Account**:
   - Go to https://developer.apple.com
   - Sign up ($99/year)

2. **Configure Credentials**:
   ```bash
   eas build:configure
   eas credentials
   ```
   - Select iOS
   - EAS can automatically manage certificates for you

### 6.2 Build iOS App

```bash
# Build for iOS Simulator (testing)
eas build --platform ios --profile preview

# Build for iOS Device (App Store)
eas build --platform ios --profile production
```

## Step 7: Build for Android

### 7.1 First Time Setup (Android)

1. **Create Google Play Developer Account**:
   - Go to https://play.google.com/console
   - Pay $25 one-time fee

2. **Configure Credentials**:
   ```bash
   eas credentials
   ```
   - Select Android
   - EAS can automatically manage keystores for you

### 7.2 Build Android App

```bash
# Build APK (for testing)
eas build --platform android --profile preview

# Build AAB (for Play Store)
eas build --platform android --profile production
```

## Step 8: Monitor Build Progress

After starting a build, you'll get a URL to monitor progress:

```
Build started: https://expo.dev/accounts/your-username/projects/focus/builds/...
```

You can also check status:
```bash
eas build:list
```

## Step 9: Download Built Apps

Once the build completes:

1. **Download from Expo Dashboard**:
   - Go to https://expo.dev
   - Navigate to your project
   - Click on "Builds"
   - Download the completed build

2. **Or use CLI**:
   ```bash
   eas build:list
   # Then download using the build ID
   ```

## Step 10: Test Your Builds

### iOS:
- **Simulator**: Install on iOS Simulator
- **Device**: Install via TestFlight (recommended) or direct install

### Android:
- **APK**: Install directly on Android device
- **AAB**: Upload to Play Store for testing

## Step 11: Submit to App Stores

### iOS - App Store (via EAS Submit)

```bash
eas submit --platform ios
```

You'll need:
- Apple Developer Account
- App Store Connect API Key (EAS can help set this up)

### Android - Play Store (via EAS Submit)

```bash
eas submit --platform android
```

You'll need:
- Google Play Developer Account
- Play Store API credentials (EAS can help set this up)

## Step 12: Update App Version

When releasing updates:

1. **Update version in app.json**:
   ```json
   {
     "expo": {
       "version": "1.0.1",  // Update version
       "ios": {
         "buildNumber": "2"  // Increment build number
       },
       "android": {
         "versionCode": 2  // Increment version code
       }
     }
   }
   ```

2. **Rebuild**:
   ```bash
   eas build --platform all --profile production
   ```

3. **Resubmit**:
   ```bash
   eas submit --platform all
   ```

## Environment Variables

Make sure your production build includes the Vercel API URL:

In `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://focus-psi-one.vercel.app/api",
        "EXPO_PUBLIC_SUPABASE_URL": "https://wqvevludffkemgicrfos.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sb_publishable_Wh-OXf9VvhfJjI7vcuYuFw_bqP9nUk1"
      }
    }
  }
}
```

## Common Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Cancel a build
eas build:cancel [build-id]

# Configure credentials
eas credentials

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Troubleshooting

### Build Fails
- Check build logs: `eas build:view [build-id]`
- Verify environment variables are set correctly
- Ensure app.json is valid

### Credentials Issues
- Run `eas credentials` to reconfigure
- EAS can auto-manage certificates/keystores

### App Store Rejection
- Review Apple's App Store guidelines
- Check for required permissions and descriptions
- Ensure privacy policy URL is set (if required)

## Cost Considerations

- **EAS Build**: Free tier includes limited builds per month
- **Apple Developer**: $99/year (required for App Store)
- **Google Play**: $25 one-time (required for Play Store)
- **EAS Submit**: Free (included with EAS Build)

## Next Steps After Building

1. ✅ Test the built app thoroughly
2. ✅ Set up TestFlight (iOS) or Internal Testing (Android)
3. ✅ Submit to App Store / Play Store
4. ✅ Set up app store listings (screenshots, descriptions, etc.)
5. ✅ Monitor app analytics and user feedback

## Resources

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- EAS Submit Docs: https://docs.expo.dev/submit/introduction/
- Expo Dashboard: https://expo.dev
- Apple Developer: https://developer.apple.com
- Google Play Console: https://play.google.com/console


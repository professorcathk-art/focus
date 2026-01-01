# Build Command with Environment Variable

## The Problem
EAS Build is trying to sync Apple Sign-In capabilities even with `EXPO_NO_CAPABILITY_SYNC=1` in `eas.json`. The env var might not be read correctly from `eas.json`.

## The Solution
Set the environment variable **before** running the build command:

```bash
export EXPO_NO_CAPABILITY_SYNC=1
eas build --platform ios --profile preview
```

Or run it in one line:
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile preview
```

## Why This Works
- Setting the env var in the shell ensures EAS CLI reads it
- The capability is already enabled in Apple Developer Portal
- EAS won't try to modify it when the env var is set
- The plugin still works for runtime functionality

## What Changed
1. Removed `usesAppleSignIn` from `app.json` - prevents EAS from trying to manage it
2. Kept `expo-apple-authentication` plugin - still provides functionality
3. Set env var before build command - ensures EAS respects it

## Next Steps
Run the build with the env var:
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile preview
```


# Fix Apple Sign-In Capability Sync Error

## Problem
EAS Build was trying to automatically sync Apple Sign-In capabilities, causing this error:
```
Failed to patch capabilities: [ { capabilityType: 'APPLE_ID_AUTH', option: 'OFF' } ]
The bundle '37DY2U93A7' cannot be deleted.
```

## Solution
1. **Removed `usesAppleSignIn: true` from `app.json`**
   - This prevents EAS from trying to automatically manage the capability
   - The capability is already manually configured in Apple Developer Portal

2. **Kept `EXPO_NO_CAPABILITY_SYNC=1` in `eas.json`**
   - This is a backup to disable capability syncing

3. **Kept `expo-apple-authentication` plugin**
   - This is still in the plugins array, so Apple Sign-In functionality works
   - The plugin doesn't trigger automatic capability syncing

## Why This Works
- `usesAppleSignIn: true` tells EAS to automatically configure the capability in Apple Developer Portal
- Since we've already configured it manually, EAS was trying to modify it and hitting conflicts
- Removing this flag means EAS won't try to sync capabilities, but the app still works because:
  - The capability is already enabled in Apple Developer Portal
  - The `expo-apple-authentication` plugin handles the runtime functionality

## Next Steps
1. Rebuild with: `eas build --platform ios --profile preview`
2. The build should complete without capability sync errors
3. Apple Sign-In will still work because it's configured in Apple Developer Portal


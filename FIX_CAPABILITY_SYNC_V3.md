# Fix Apple Sign-In Capability Sync Error (Final Solution)

## Problem
EAS Build is trying to sync Apple Sign-In capabilities and failing with:
```
Failed to patch capabilities: [ { capabilityType: 'APPLE_ID_AUTH', option: 'OFF' } ]
The bundle '37DY2U93A7' cannot be deleted.
```

## Root Cause
When `usesAppleSignIn` is missing from `app.json`, EAS detects the `expo-apple-authentication` plugin and tries to disable the capability, causing a conflict with the manually enabled capability in Apple Developer Portal.

## Solution

### Step 1: Add `usesAppleSignIn: true` back to `app.json`
This tells EAS the capability should be ON, matching your Apple Developer Portal configuration.

### Step 2: Ensure `EXPO_NO_CAPABILITY_SYNC=1` is set in `eas.json`
This prevents EAS from actually trying to modify capabilities in Apple Developer Portal.

### Step 3: Verify Apple Developer Portal
Make sure "Sign In with Apple" is enabled for your App ID (`com.focuscircle`).

## Why This Works
- `usesAppleSignIn: true` tells EAS: "This capability should be ON"
- `EXPO_NO_CAPABILITY_SYNC=1` tells EAS: "Don't actually sync, just use what's in Apple Developer Portal"
- Apple Developer Portal has it enabled manually
- Result: No conflict, no sync attempts, build succeeds ✅

## Alternative: Set Environment Variable Before Build
If the above doesn't work, you can also set the env var directly:

```bash
export EXPO_NO_CAPABILITY_SYNC=1
eas build --platform ios --profile preview
```

## Summary
- ✅ `usesAppleSignIn: true` in `app.json` (matches Apple Developer Portal)
- ✅ `EXPO_NO_CAPABILITY_SYNC=1` in `eas.json` (prevents sync attempts)
- ✅ Capability enabled in Apple Developer Portal (manual configuration)
- ✅ Build should succeed without capability sync errors


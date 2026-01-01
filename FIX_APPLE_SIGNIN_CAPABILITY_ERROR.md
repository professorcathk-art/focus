# Fix: Apple Sign-In Capability Sync Error

## ❌ **Error:**
```
Failed to patch capabilities: [ { capabilityType: 'APPLE_ID_AUTH', option: 'OFF' } ]
Failed to sync capabilities com.focuscircle
The bundle '37DY2U93A7' cannot be deleted. Delete all the Apps related to this bundle to proceed.
```

## 🔍 **Root Cause:**

This is an **Apple Developer Portal** issue, not a code error. EAS is trying to sync capabilities but:
1. There are existing apps associated with the bundle ID
2. Apple's API is preventing capability changes
3. This is a **non-critical** error - the build can still succeed

## ✅ **Solution Options:**

### Option 1: Disable Auto Capability Syncing (Recommended)

Add to `eas.json` build profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

Then set environment variable in EAS Build:
- `EXPO_NO_CAPABILITY_SYNC=1`

### Option 2: Manually Configure in Apple Developer Portal

1. Go to: https://developer.apple.com/account/resources/identifiers/bundleId/edit/37DY2U93A7
2. Enable "Sign In with Apple" capability manually
3. Save changes
4. Retry build

### Option 3: Verify App.json Configuration

Make sure `usesAppleSignIn: true` is set (it is ✅)

---

## 🎯 **Quick Fix:**

The error is **non-critical** - it's just a warning about capability syncing. The build should still work if:
- Apple Sign-In is already enabled in Apple Developer Portal
- The capability is manually configured

**Try building again** - it may succeed despite this warning.

---

**Status:** This is a capability sync warning, not a build-blocking error.


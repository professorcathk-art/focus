# Rebuild App to See Changes

## Why Rebuild?

You've made code changes (error handling improvements, Google OAuth fix) that need to be bundled into the app. The installed app still has the old code.

## Option 1: EAS Build (Cloud - Recommended)

```bash
cd /Users/mickeylau/focus
eas build --platform ios --profile preview
```

**What happens:**
1. EAS uploads your code
2. Builds in cloud (15-20 minutes)
3. Provides download link
4. Install on iPhone

## Option 2: Local Build (Faster if Xcode is set up)

```bash
cd /Users/mickeylau/focus
npx expo run:ios --device
```

**What happens:**
1. Builds locally on your Mac
2. Installs directly on connected iPhone
3. Takes 10-15 minutes (first build)

## What Changed?

### 1. Apple Sign-In Error Handling
- Now shows detailed error messages
- Helps identify configuration issues
- Shows bundle identifier in error

### 2. Google OAuth Redirect Fix
- Fixed "requested path is invalid" error
- Now uses Supabase callback URL (HTTPS)
- Proper OAuth flow

## After Rebuild

1. Install the new build
2. Test Apple Sign-In - should see better error messages
3. Test Google Sign-In - should work without redirect error

## Quick Test Checklist

- [ ] Rebuild app (EAS or local)
- [ ] Install on iPhone
- [ ] Test Apple Sign-In
- [ ] Test Google Sign-In
- [ ] Verify error messages are more helpful


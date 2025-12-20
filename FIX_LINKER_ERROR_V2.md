# Fix iOS Linker Error - Comprehensive Solution

## Changes Already Made ✅

1. ✅ Added `react-native-reanimated/plugin` to `babel.config.js` (must be last)
2. ✅ Added `expo-apple-authentication` to `app.json` plugins
3. ✅ Regenerated iOS project with `npx expo prebuild --clean`

## Common Linker Error Causes

### 1. React Native Reanimated Configuration
**Issue**: Reanimated requires specific Babel plugin configuration
**Fix**: ✅ Already done - plugin added to babel.config.js

### 2. Missing Native Module Plugins
**Issue**: Native modules need to be in app.json plugins array
**Fix**: ✅ Already done - expo-apple-authentication added

### 3. iOS Project Out of Sync
**Issue**: Native iOS project doesn't match app.json configuration
**Fix**: ✅ Already done - regenerated with prebuild

## Next Steps

### Option 1: Try Build Again (Recommended)
Since we've regenerated the iOS project, try building again:

```bash
cd /Users/mickeylau/focus
eas build --platform ios --profile preview
```

EAS Build will regenerate the iOS project from scratch, so our changes should be picked up.

### Option 2: Check Specific Error in EAS Dashboard
1. Go to https://expo.dev
2. Navigate to your project → Builds
3. Click on the failed build
4. Look at "Xcode Logs" section
5. Search for specific linker errors like:
   - "Undefined symbol"
   - "Duplicate symbol"
   - "Framework not found"

### Option 3: Try Development Build Instead
Development builds sometimes have different linking behavior:

```bash
eas build --platform ios --profile development
```

### Option 4: Check for Missing Dependencies
If the error persists, check if all native modules are properly installed:

```bash
cd /Users/mickeylau/focus
npm install
npx expo install --fix
```

## If Error Persists

Please share:
1. The specific error message from EAS build logs (not just "linker command failed")
2. Any "Undefined symbol" or "Framework not found" errors
3. The full Xcode logs if possible

This will help identify the exact cause.


# Fix iOS Linker Error

## Changes Made

1. ✅ Added `react-native-reanimated/plugin` to `babel.config.js` (must be last plugin)
2. ✅ Added `expo-apple-authentication` to `app.json` plugins array

## Next Steps

1. **Commit these changes:**
   ```bash
   git add app.json babel.config.js
   git commit -m "Fix iOS linker error: add reanimated babel plugin and apple auth plugin"
   ```

2. **Rebuild with EAS:**
   ```bash
   cd /Users/mickeylau/focus
   eas build --platform ios --profile preview
   ```

## What Was Wrong

- `react-native-reanimated` requires a Babel plugin that must be added LAST in the plugins array
- `expo-apple-authentication` should be explicitly listed in app.json plugins for proper native module linking

## If Build Still Fails

Check the Xcode logs in EAS dashboard for specific linker errors. Common issues:
- Missing frameworks
- Duplicate symbols
- Architecture mismatches


# RNWorklets Podspec Fix

## The Real Problem
CocoaPods error:
```
[!] Unable to find a specification for `RNWorklets` depended upon by `RNReanimated`
```

## Root Cause
`react-native-reanimated` depends on a CocoaPods podspec called `RNWorklets`, but we were only creating a JavaScript package. CocoaPods needs a `.podspec` file to link native modules.

## Fix Applied ✅
Updated `scripts/postinstall.js` to create:
1. ✅ `package.json` with version `0.5.1` (for JavaScript)
2. ✅ `plugin.js` (for Babel)
3. ✅ `index.js` (for module exports)
4. ✅ **`RNWorklets.podspec`** (for CocoaPods - NEW!)

The podspec points to `react-native-worklets-core` as a dependency, so CocoaPods can find and link the native module.

## Why This Will Work
- ✅ CocoaPods will find `RNWorklets.podspec` in `node_modules/react-native-worklets/`
- ✅ Podspec declares dependency on `react-native-worklets-core`
- ✅ `react-native-reanimated` can resolve its dependency
- ✅ Native modules will link correctly

## Next Build
```bash
cd /Users/mickeylau/focus && EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile preview --clear-cache
```

This should fix the CocoaPods installation error!


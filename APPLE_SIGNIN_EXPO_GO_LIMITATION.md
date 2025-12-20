# Apple Sign-In Limitation: Expo Go vs Development Build

## ⚠️ Important: Apple Sign-In Doesn't Work in Expo Go

### The Problem

When testing in **Expo Go**, Apple Sign-In will fail with this error:
```
Unacceptable audience in id_token: [host.exp.Exponent]
```

### Why This Happens

1. **Expo Go** uses bundle identifier: `host.exp.Exponent`
2. **Your app** uses bundle identifier: `com.focuscircle`
3. **Apple Sign-In tokens** are tied to the bundle identifier
4. **Supabase** rejects tokens from `host.exp.Exponent` because it doesn't match your configured Service ID

### Solution: Use Development Build

Apple Sign-In **only works** in:
- ✅ **Development Build** (custom dev client)
- ✅ **Production Build** (App Store/TestFlight)
- ❌ **Expo Go** (not supported)

---

## 🚀 How to Create a Development Build

### Option 1: Local Development Build (Recommended)

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS Build**:
   ```bash
   eas build:configure
   ```

4. **Build for iOS**:
   ```bash
   eas build --platform ios --profile development
   ```

5. **Install on device**:
   - EAS will provide a download link
   - Install the `.ipa` file on your device via TestFlight or direct install

### Option 2: Local iOS Build (Faster for Testing)

1. **Make sure you have Xcode installed**

2. **Run local build**:
   ```bash
   npx expo run:ios --device
   ```

3. **Select your connected iPhone** when prompted

4. **Wait for build to complete** (first build takes 10-15 minutes)

5. **App installs automatically** on your device

---

## ✅ Testing Apple Sign-In

### After Creating Development Build:

1. **Open the development build** on your device (not Expo Go)
2. **Navigate to Sign In screen**
3. **Tap "Continue with Apple"**
4. **Should work correctly** ✅

---

## 🔄 Development Workflow

### For Testing Other Features:
- **Use Expo Go** - Fast iteration, hot reload
- **Skip Apple Sign-In** - Use email/password or Google OAuth instead

### For Testing Apple Sign-In:
- **Use Development Build** - Required for Apple Sign-In
- **Slower iteration** - Need to rebuild for code changes

### Recommended Approach:
1. **Develop features** in Expo Go (faster)
2. **Test Apple Sign-In** in development build (when needed)
3. **Final testing** in development build before release

---

## 📝 Error Message

The app now shows a user-friendly error message when Apple Sign-In is attempted in Expo Go:

> "Apple Sign-In requires a development build. Expo Go uses a different bundle identifier. Please build the app with 'npx expo run:ios' or use a development build."

---

## 🎯 Summary

- ✅ **Code is correct** - Apple Sign-In implementation is proper
- ✅ **Error handling added** - User-friendly error message
- ⚠️ **Expo Go limitation** - Apple Sign-In requires development build
- ✅ **Solution available** - Use `npx expo run:ios` or EAS build

---

## Next Steps

1. **For now**: Test other features in Expo Go
2. **When ready**: Create development build to test Apple Sign-In
3. **For production**: Build with EAS or Xcode for App Store



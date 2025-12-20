# Apple Sign-In Implementation Guide

## Prerequisites

⚠️ **Important**: Apple Sign-In requires a **paid Apple Developer account** ($99/year).

### What You Need:
1. ✅ Apple Developer Program membership ($99/year)
2. ✅ App ID configured in Apple Developer Portal
3. ✅ "Sign in with Apple" capability enabled
4. ✅ Supabase project with Apple provider configured

## Step-by-Step Setup

### Step 1: Install Required Package

```bash
npx expo install expo-apple-authentication
```

### Step 2: Configure app.json

Add Apple Sign-In capability to your iOS configuration:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.focuscircle",
      "usesAppleSignIn": true
    }
  }
}
```

### Step 3: Configure Apple Developer Portal

1. **Go to Apple Developer Portal**: https://developer.apple.com/account
2. **Navigate to Certificates, Identifiers & Profiles**
3. **Select Identifiers** → **App IDs**
4. **Find your App ID** (com.focuscircle) or create a new one
5. **Enable "Sign in with Apple"** capability
6. **Save** the configuration

### Step 4: Configure Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. **Navigate to Authentication** → **Providers**
3. **Find Apple provider** and click **Enable**
4. **Configure Apple provider**:
   - **Service ID**: Create one in Apple Developer Portal (see below)
   - **Team ID**: Found in Apple Developer Portal (top right)
   - **Key ID**: Create a key in Apple Developer Portal (see below)
   - **Private Key**: Download from Apple Developer Portal (see below)

### Step 5: Create Apple Service ID

1. **In Apple Developer Portal** → **Identifiers** → **Services IDs**
2. **Click "+" to create new Service ID**
3. **Identifier**: `com.focuscircle.signin` (or similar)
4. **Description**: "Focus App Sign In"
5. **Enable "Sign in with Apple"**
6. **Configure** → **Add Domain**:
   - **Domain**: `wqvevludffkemgicrfos.supabase.co`
   - **Return URLs**: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
7. **Save** the Service ID

### Step 6: Create Apple Key

1. **In Apple Developer Portal** → **Keys**
2. **Click "+" to create new key**
3. **Key Name**: "Focus App Sign In Key"
4. **Enable "Sign in with Apple"**
5. **Continue** → **Register**
6. **Download the key** (.p8 file) - **You can only download once!**
7. **Note the Key ID** (shown after creation)

### Step 7: Get Your Team ID

1. **In Apple Developer Portal** → **Membership** (top right)
2. **Copy your Team ID** (10-character string)

### Step 8: Configure Supabase with Apple Credentials

In Supabase Dashboard → Authentication → Providers → Apple:

- **Service ID**: `com.focuscircle.signin` (from Step 5)
- **Team ID**: Your Team ID (from Step 7)
- **Key ID**: Your Key ID (from Step 6)
- **Private Key**: Contents of the .p8 file (from Step 6)

**Private Key Format** (paste the entire contents):
```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----
```

### Step 9: Add Redirect URLs in Supabase

1. **In Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Add Redirect URLs**:
   - `focus:///(auth)/signin` (for native builds)
   - `exp:///(auth)/signin` (for Expo Go)
   - `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback` (Supabase callback)

## Implementation

### 1. Update Auth Store (`src/store/auth-store.ts`)

Add `signInWithApple` function similar to `signInWithGoogle`.

### 2. Update Sign-In Screen (`app/(auth)/signin.tsx`)

Add Apple Sign-In button similar to Google Sign-In button.

### 3. Update Sign-Up Screen (`app/(auth)/signup.tsx`)

Add Apple Sign-In button for consistency.

## Testing

### Development (Expo Go)
- ✅ Can test Apple Sign-In in Expo Go
- ⚠️ Requires physical iOS device (not simulator)
- ⚠️ Must be signed in with Apple ID on device

### Production
- ✅ Works in native builds
- ✅ Works in TestFlight
- ✅ Works in App Store

## Troubleshooting

### Error: "Sign in with Apple is not available"
- **Cause**: Not signed in with Apple ID on device
- **Solution**: Sign in with Apple ID in Settings → Sign in to your iPhone

### Error: "Invalid client"
- **Cause**: Wrong Service ID or Team ID in Supabase
- **Solution**: Verify Service ID and Team ID match Apple Developer Portal

### Error: "Invalid key"
- **Cause**: Wrong Key ID or Private Key in Supabase
- **Solution**: Verify Key ID matches and Private Key is correctly formatted

### Error: "Redirect URI mismatch"
- **Cause**: Return URL not configured in Apple Service ID
- **Solution**: Add Supabase callback URL to Service ID configuration

## Cost

- **Apple Developer Program**: $99/year (required)
- **Supabase**: Free tier supports Apple Sign-In ✅

## Next Steps

1. ✅ Install `expo-apple-authentication`
2. ✅ Configure `app.json`
3. ✅ Set up Apple Developer Portal
4. ✅ Configure Supabase
5. ✅ Implement code (see implementation files)
6. ✅ Test on physical iOS device

## References

- [Expo Apple Authentication Docs](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Supabase Apple Provider Docs](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)


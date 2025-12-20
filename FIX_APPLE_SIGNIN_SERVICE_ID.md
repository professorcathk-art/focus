# Fix Apple Sign-In: Create Service ID

## Problem
Error: "Unacceptable audience in id_token: [com.focuscircle]"

This happens because Supabase expects a **Service ID** (`com.focuscircle.signin`), but it's receiving your **App ID** (`com.focuscircle`).

## Solution: Create a Service ID

### Step 1: Create Service ID in Apple Developer Portal

1. **Go to Apple Developer Portal**: https://developer.apple.com/account
2. **Navigate to**: Certificates, Identifiers & Profiles → **Identifiers**
3. **Click the "+" button** (top left) to create a new identifier
4. **Select "Services IDs"** → Click **Continue**
5. **Fill in the form**:
   - **Description**: "Focus App Sign In"
   - **Identifier**: Try one of these (in order):
     - `com.focuscircle.applesignin` (recommended)
     - `com.focuscircle.signin.service`
     - `signin.focuscircle.com`
     - `applesignin.focuscircle.com`
   
   **Note**: If one doesn't work, try the next one. Apple may restrict identifiers that are too similar to existing App IDs.
6. **Click Continue** → **Register**

### Step 2: Configure Service ID for Sign In with Apple

1. **Click on your newly created Service ID** (`com.focuscircle.signin`)
2. **Check the box**: "Sign In with Apple"
3. **Click "Configure"** (next to "Sign In with Apple")
4. **Primary App ID**: Select `com.focuscircle` (your App ID)
5. **Website URLs**:
   - **Domains and Subdomains**: `wqvevludffkemgicrfos.supabase.co`
   - **Return URLs**: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
6. **Click "Save"** → **Continue** → **Save**

### Step 3: Update Supabase Configuration

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. **Navigate to**: Authentication → Providers → Apple
3. **Update Client ID** (Service ID):
   - **Client ID**: Use the Service ID you created (e.g., `com.focuscircle.applesignin` or whichever one worked)
4. **Verify other settings**:
   - **Team ID**: `YUNUL5V5R6` (your Team ID)
   - **Key ID**: `U3ZQ3S6AK6` (your Key ID)
   - **Secret Key**: Your JWT (from `generate-apple-jwt.js`)
5. **Save** the configuration

## Important Notes

### App ID vs Service ID

- **App ID** (`com.focuscircle`): Used by your iOS app ✅ (you have this)
- **Service ID** (`com.focuscircle.signin`): Used by Supabase as "Client ID" ❌ (you need this)

### Server-to-Server Notification Endpoint

You mentioned setting this:
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

**This is NOT needed** for native iOS Sign In with Apple. That endpoint is for web-based flows. For native apps using `expo-apple-authentication`, we use direct token exchange, not web callbacks.

However, **it won't hurt** to have it configured - just make sure the Service ID's Return URL matches.

## Verification Checklist

After creating the Service ID:

- [ ] Service ID created: `com.focuscircle.applesignin` (or alternative that worked)
- [ ] Service ID has "Sign In with Apple" enabled
- [ ] Service ID configured with Primary App ID: `com.focuscircle`
- [ ] Service ID has Return URL: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
- [ ] Supabase Client ID set to: `com.focuscircle.signin`
- [ ] Supabase Team ID: `YUNUL5V5R6`
- [ ] Supabase Key ID: `U3ZQ3S6AK6`
- [ ] Supabase Secret Key: Valid JWT

## Testing

After completing these steps:

1. **Rebuild your app** (the bundle ID is already correct)
2. **Test Apple Sign-In**
3. The error should be resolved!

## Current Apple Developer Portal Setup

Your current setup:
- ✅ App ID: `com.focuscircle`
- ✅ Sign In with Apple enabled on App ID
- ✅ Primary App ID enabled
- ❌ **Missing**: Service ID `com.focuscircle.signin`

## Summary

**What you need to do:**
1. Create Service ID: `com.focuscircle.signin`
2. Configure it with Sign In with Apple
3. Set Return URL to Supabase callback
4. Update Supabase Client ID to use Service ID

**What you DON'T need to change:**
- Your App ID (`com.focuscircle`) is correct ✅
- Your bundle identifier is correct ✅
- Server-to-server notification endpoint is optional (not needed for native apps)


# Fix Supabase Apple Client ID for Native Apps

## Problem

Error: "Unacceptable audience in id_token: [com.focuscircle]"

This happens because:
- Native iOS apps using `expo-apple-authentication` return tokens with **App ID** as the audience
- Supabase is configured with **Service ID** (`com.focuscircle.applesignin`)
- They don't match!

## Solution

For **native iOS apps**, Supabase Client ID should be the **App ID**, not the Service ID.

## Update Supabase Configuration

1. **Go to**: Supabase Dashboard → Authentication → Providers → Apple

2. **Change Client ID** from:
   - ❌ `com.focuscircle.applesignin` (Service ID - for web OAuth)
   - ✅ `com.focuscircle` (App ID - for native apps)

3. **Keep other settings**:
   - Team ID: `YUNUL5V5R6`
   - Key ID: `U3ZQ3S6AK6`
   - Secret Key: (Keep the JWT - it's still valid)

4. **Save** the configuration

## Why This Happens

### Native App Flow (expo-apple-authentication):
- App requests Apple Sign-In with **App ID** (`com.focuscircle`)
- Apple returns identity token with **App ID** as audience
- Supabase expects Client ID to match token audience
- ✅ Use **App ID** as Client ID

### Web OAuth Flow:
- Uses **Service ID** (`com.focuscircle.applesignin`)
- Token audience is Service ID
- ✅ Use **Service ID** as Client ID

## Summary

**For your native iOS app:**
- Supabase Client ID = `com.focuscircle` (App ID)
- Service ID (`com.focuscircle.applesignin`) is still needed in Apple Developer Portal for web flows, but not used in Supabase for native apps

## After Update

1. Update Supabase Client ID to `com.focuscircle`
2. Test Apple Sign-In again
3. Should work! ✅


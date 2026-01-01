# Apple Sign-In Identifiers Explained

## What You Need for Native iOS Apps

### ✅ Required: App ID (Bundle ID)
- **Identifier**: `com.focuscircle`
- **Type**: App ID (explicit)
- **Status**: ✅ You have this
- **Purpose**: Used by your native iOS app for Apple Sign-In
- **Where**: Apple Developer Portal → Identifiers → App IDs

### ⚠️ Optional: Service ID
- **Identifier**: `com.focuscircle.applesignin` (if created)
- **Type**: Service ID
- **Status**: ❓ Not required for native apps
- **Purpose**: Only needed for web-based OAuth flows
- **Where**: Apple Developer Portal → Identifiers → Services IDs

## Current Setup

### For Your Native iOS App:
1. ✅ **App ID** (`com.focuscircle`) - You have this
2. ✅ **Supabase Client ID** should be: `com.focuscircle` (App ID)
3. ❌ **Service ID** - NOT required for native apps

## Why You Don't Need Service ID

When using `expo-apple-authentication` (native iOS):
- Apple returns identity tokens with **App ID** as the audience
- Supabase expects the Client ID to match the token audience
- Therefore, Supabase Client ID = App ID (`com.focuscircle`)
- Service ID is only used for web OAuth flows

## What Supabase Should Have

Go to Supabase Dashboard → Authentication → Providers → Apple:

- **Client ID**: `com.focuscircle` ✅ (App ID, not Service ID)
- **Team ID**: `YUNUL5V5R6`
- **Key ID**: `U3ZQ3S6AK6`
- **Secret Key**: (Your JWT)

## Summary

**You're NOT missing anything!** 

For native iOS apps:
- ✅ App ID (`com.focuscircle`) - Required and you have it
- ❌ Service ID - Not required, only for web OAuth

If you created a Service ID (`com.focuscircle.applesignin`) earlier, you can:
- Keep it (doesn't hurt, just unused)
- Or delete it (not needed for native apps)

## Next Steps

1. Verify Supabase Client ID is set to `com.focuscircle` (App ID)
2. Rebuild your app
3. Test Apple Sign-In


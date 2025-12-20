# Fix Google OAuth "Requested Path is Invalid" Error

## Problem
Google OAuth shows error: "requested path is invalid" after selecting a Google account.

## Root Cause
Supabase requires **HTTPS URLs** for OAuth redirects, not deep link URLs like `focus://` or `exp://`. The app was trying to redirect directly to a deep link, which Supabase rejects.

## Solution Applied
Changed the redirect URL to use Supabase's callback URL instead of a deep link.

### Before (Wrong):
```typescript
const redirectUrl = Linking.createURL('/(auth)/signin'); // Creates focus:// or exp:// URL
```

### After (Correct):
```typescript
const redirectUrl = `${supabaseUrl}/auth/v1/callback`; // HTTPS URL
```

## How It Works Now

1. User taps "Continue with Google"
2. App opens browser with Google OAuth URL
3. User authenticates with Google
4. Google redirects to Supabase callback URL (`https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`)
5. Supabase processes OAuth and creates session
6. App detects session via `onAuthStateChange` listener
7. User is signed in ✅

## Verify Supabase Configuration

Make sure Supabase has the callback URL configured:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **"Redirect URLs"**, verify this URL is listed:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
3. If not, add it and **Save**

## Rebuild Required

**You need to rebuild the app** to see this fix:

```bash
cd /Users/mickeylau/focus
eas build --platform ios --profile preview
```

Or if building locally:
```bash
npx expo run:ios --device
```

## Testing After Rebuild

1. Install the new build on your iPhone
2. Try Google Sign-In again
3. Should work without the "requested path is invalid" error ✅


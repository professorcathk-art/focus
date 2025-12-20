# Fix OAuth Deep Link Redirect

## Problem
Google OAuth opens browser and redirects to Site URL (`https://wqvevludffkemgicrfos.supabase.co/?code=...`), but the app cannot intercept this URL to complete authentication.

## Solution
Use deep link URL (`focus://`) so the app can intercept the OAuth callback.

## Steps

### 1. Update Supabase Redirect URLs

Go to: **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**

**Add this URL:**
```
focus://auth-callback
```

**Keep this URL (Site URL - required):**
```
https://wqvevludffkemgicrfos.supabase.co
```

**You can remove these old URLs if they exist:**
- `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback` (old callback URL - not needed)
- Any other old redirect URLs that aren't working

**Important:** The format `focus://auth-callback` is simple and Supabase should accept it. If Supabase still rejects custom URL schemes, see the workaround below:

### 2. Alternative: Use Site URL + Web Redirect Page

If Supabase doesn't accept `focus://` URLs, create a web page that redirects to the deep link:

1. **Keep Site URL as redirectTo** in code (already done)
2. **Create a redirect page** at your backend that redirects to `focus://auth/callback?code=...`
3. **Add the redirect page URL** to Supabase Redirect URLs

### 3. Verify Deep Link Handling

The app now:
- ✅ Uses `focus:///(auth)/signin` as redirectTo
- ✅ Intercepts deep links in `app/_layout.tsx`
- ✅ Extracts OAuth code from URL
- ✅ Exchanges code for session via `supabase.auth.getSession()`

## Testing

1. Try Google login
2. Browser should open for Google sign-in
3. After Google auth, browser should redirect to `focus://` URL
4. App should intercept and complete login
5. Check console logs for `[Deep Link]` messages

## If Still Not Working

1. **Check Supabase logs** - Look for redirect errors
2. **Verify URL scheme** - Make sure `app.json` has `"scheme": "focus"`
3. **Test deep link manually** - Try opening `focus://test` in Safari to see if app opens
4. **Check iOS Info.plist** - Verify URL scheme is registered (should be automatic with Expo)

## Current Code Changes

- ✅ `src/store/auth-store.ts` - Uses `Linking.createURL('/(auth)/signin')` for redirectTo
- ✅ `app/_layout.tsx` - Improved deep link handling to extract code and exchange for session


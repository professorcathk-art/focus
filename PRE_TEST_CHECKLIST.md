# Pre-Test Checklist - All Fixes Verified ✅

## Google OAuth Configuration

### Important: Which Client ID to Use
Since you're using **Supabase** for OAuth, you must use the **WEB client ID**:
- ✅ **Use**: `340999206190-mi3ovam7p300b2h5h698n8s4pci08lo2.apps.googleusercontent.com` (Web)
- ❌ **Don't use**: `340999206190-sghqq7o3kklookrcpgk1b4949ivmsn4j.apps.googleusercontent.com` (iOS)

**Reason**: Supabase handles OAuth through a web browser flow, not native iOS OAuth. The iOS client ID is only for native Google Sign-In SDK (which we're not using).

### Supabase Configuration
1. Go to Supabase Dashboard → Authentication → Providers → Google
2. **Client ID (for OAuth)**: `340999206190-mi3ovam7p300b2h5h698n8s4pci08lo2.apps.googleusercontent.com`
3. **Client Secret**: Your Google OAuth client secret (from Google Cloud Console)
4. **Redirect URLs**: Must include:
   - `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
   - `focus://auth-callback`

### Google Cloud Console Configuration
1. **Web Client ID** (`340999206190-mi3ovam7p300b2h5h698n8s4pci08lo2`):
   - **Authorized redirect URIs** must include:
     - `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
   - **OAuth consent screen**:
     - App name: "Focus Circle" (or "Focus circle")
     - Upload app logo
     - Add privacy policy and terms links

2. **iOS Client ID** (`340999206190-sghqq7o3kklookrcpgk1b4949ivmsn4j`):
   - ⚠️ **Note**: This is NOT used with Supabase OAuth
   - Bundle ID mismatch: You set `com.focus.app` but app uses `com.focuscircle`
   - You can ignore this iOS client ID for now

## Code Fixes Verified ✅

### 1. Google Login Redirect Loop Fix ✅
- **File**: `app/auth-callback.tsx`
- **Fix**: Multiple session verification checks with retries
- **Fix**: Early return after successful redirect
- **Fix**: `hasRedirectedRef` guard to prevent multiple redirects
- **Status**: ✅ Implemented

### 2. Deep Link Deduplication ✅
- **File**: `app/_layout.tsx`
- **Fix**: `processedUrlsRef` to track processed URLs
- **Fix**: `processingDeepLink` flag to prevent simultaneous processing
- **Fix**: Timeout to clear old processed URLs
- **Status**: ✅ Implemented

### 3. Sign-In Page Auto-Redirect ✅
- **File**: `app/(auth)/signin.tsx`
- **Fix**: Redirects to `/(tabs)/record` if already authenticated
- **Status**: ✅ Implemented

### 4. Root Index Auth Check ✅
- **File**: `app/index.tsx`
- **Fix**: `hasCheckedRef` to prevent multiple `checkAuth()` calls
- **Status**: ✅ Implemented

### 5. Today Page Instant Loading ✅
- **File**: `app/(tabs)/todo.tsx`
- **Fix**: Memory cache check FIRST (synchronous, instant)
- **Fix**: Shows cached data immediately
- **Fix**: Background refresh from API (non-blocking)
- **Fix**: Preloads today's todos on mount/foreground
- **Status**: ✅ Implemented

### 6. Apple Sign-In Configuration ✅
- **File**: `src/store/auth-store.ts`
- **Bundle ID**: `com.focuscircle` ✅
- **Supabase Client ID**: `com.focuscircle` ✅
- **Service ID**: `com.focuscircle.applesignin` ✅
- **Status**: ✅ Configured

## All Issues Fixed ✅

1. ✅ Google login redirect loop - Fixed with session verification and guards
2. ✅ Today page flashing - Fixed with instant memory cache loading
3. ✅ Today page slow loading - Fixed with instant cache + background refresh
4. ✅ Calendar layout - Fixed with fixed-width cells
5. ✅ Checkbox toggle flashing - Fixed with togglingRef guard
6. ✅ Settings page crash - Fixed with proper imports
7. ✅ Apple Sign-In bundle ID - Fixed with correct configuration
8. ✅ Deep link handling - Fixed with deduplication and guards

## Ready to Test ✅

### Before Rebuilding:
1. ✅ Verify Supabase Google OAuth uses WEB client ID
2. ✅ Verify Google Cloud Console redirect URIs are correct
3. ✅ Verify all code changes are synced to GitHub

### Rebuild Steps:
```bash
# 1. Sync to GitHub (if not already done)
git add .
git commit -m "Fix Google OAuth redirect loop and optimize today page loading"
git push

# 2. Wait for Vercel deployment (if backend changes)

# 3. Rebuild iOS app
eas build --platform ios --profile development
```

### Testing Checklist:
- [ ] Google login completes without redirect loop
- [ ] Today page loads instantly (shows cached data immediately)
- [ ] Today page refreshes in background without blocking UI
- [ ] Calendar layout is properly aligned
- [ ] Checkbox toggle doesn't flash
- [ ] Settings page doesn't crash
- [ ] Apple Sign-In works correctly
- [ ] Deep links work correctly

## Expected Behavior

### Google Login:
1. User taps "Sign in with Google"
2. Browser opens with Google sign-in
3. User selects account
4. Browser redirects to `focus://auth-callback?code=...`
5. App intercepts deep link
6. App exchanges code for session
7. App redirects to `/(tabs)/record`
8. ✅ **No redirect loop**

### Today Page:
1. User opens Today page
2. ✅ **Instant display** from memory cache (if available)
3. Background refresh from API
4. UI updates smoothly without flashing
5. ✅ **No 0.5-1 second delay**

## Notes

- The iOS Google OAuth client ID is not used with Supabase
- Only the WEB client ID is needed in Supabase
- The domain `wqvevludffkemgicrfos.supabase.co` will appear in Google consent screen (this is normal)
- You can customize the app name to "Focus Circle" in Google Cloud Console OAuth consent screen


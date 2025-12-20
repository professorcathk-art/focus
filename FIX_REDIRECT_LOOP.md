# Fix: Redirect Loop Issue

## Root Cause Found! 🎯

Looking at your Supabase log, the authentication **succeeds** (status 302), but then Supabase tries to redirect AFTER processing the callback.

**The Problem:**
- We were setting `redirectTo: https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
- Supabase processes OAuth at `/auth/v1/callback` ✅
- Then Supabase tries to redirect TO `/auth/v1/callback` again ❌
- This creates a redirect loop or invalid redirect → "requested path is invalid"

## The Fix

**Change `redirectTo` from callback URL to Site URL:**

### Before (Wrong):
```typescript
redirectTo: `${supabaseUrl}/auth/v1/callback` // ❌ Redirects to callback again
```

### After (Correct):
```typescript
redirectTo: supabaseUrl // ✅ Redirects to Site URL after processing
```

## Why This Works

1. Google redirects to: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
2. Supabase processes OAuth and creates session ✅
3. Supabase redirects to: `https://wqvevludffkemgicrfos.supabase.co` (Site URL) ✅
4. App detects session via `onAuthStateChange` listener ✅

## Code Changes Applied

✅ Updated `signInWithGoogle` to use Site URL instead of callback URL
✅ Updated `signUp` emailRedirectTo to use Site URL instead of callback URL

## Supabase Configuration (Should Already Be Set)

- **Site URL**: `https://wqvevludffkemgicrfos.supabase.co` ✅
- **Redirect URLs**: Should include callback URL for Google OAuth:
  - `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback` ✅

## Next Steps

**You need to rebuild the app** to see these changes:

```bash
cd /Users/mickeylau/focus
eas build --platform ios --profile preview
```

After rebuild:
- ✅ Google login should work
- ✅ Email confirmation should work

## Why Both Failed the Same Way

Both email confirmation and Google OAuth use the same `redirectTo` URL. When we set it to the callback URL, Supabase tries to redirect to the callback URL AFTER processing it, which creates the same error for both flows.

Now both use Site URL, which Supabase can redirect to successfully.


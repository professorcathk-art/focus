# Fix Email Confirmation Redirect Error

## Problem

When users sign up with email, clicking the confirmation link shows:
```
Error: requested path is invalid
```

This happens because the `emailRedirectTo` URL is not in Supabase's allowed redirect URLs list.

## Solution

### Step 1: Add Redirect URLs in Supabase

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Navigate to **Authentication** → **URL Configuration**
3. Under **"Redirect URLs"**, add these URLs:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   focus:///(auth)/signin
   exp:///(auth)/signin
   ```
4. Click **"Save"**

### Step 2: Update Code to Use Deep Link (Better UX)

The current code uses Supabase callback URL, which works but shows a web page. For better UX, we can use deep links that redirect back to the app.

**Option A: Use Deep Link (Recommended)**
- Email confirmation link redirects to app deep link
- App automatically opens when user clicks link
- Seamless experience

**Option B: Use Supabase Callback (Current)**
- Email confirmation link redirects to Supabase callback page
- User sees success message
- User manually opens app
- App detects session

### Step 3: Verify Site URL

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: Should be set to your app's deep link scheme or Supabase URL
- For testing: `https://wqvevludffkemgicrfos.supabase.co`
- For production: Can be your app's website or Supabase URL

## Current Implementation

The code currently uses:
```typescript
const redirectUrl = `${supabaseUrl}/auth/v1/callback`;
```

This URL **must** be in Supabase's allowed redirect URLs list.

## Fix

1. ✅ Add `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback` to Supabase redirect URLs
2. ✅ Verify Site URL is configured
3. ✅ Test email signup flow

## Alternative: Disable Email Confirmation (Development Only)

If you want to skip email confirmation during development:

1. Go to Supabase Dashboard → Authentication → Settings
2. Disable **"Enable email confirmations"**
3. Users will be signed in immediately after signup

**Note:** Re-enable for production!

## Testing

1. Sign up with email
2. Check email for confirmation link
3. Click confirmation link
4. Should redirect to Supabase callback or app (depending on configuration)
5. Open app
6. Should be signed in ✅



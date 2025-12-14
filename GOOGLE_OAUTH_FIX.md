# Google OAuth Login Fix Guide

## Issue
Google login is not working because the redirect URL needs to be properly configured in Supabase.

## Solution

### Step 1: Configure Redirect URLs in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Navigate to **Authentication** → **URL Configuration**
3. Add these redirect URLs to **Redirect URLs**:

**For Development (Expo Go):**
```
exp://192.168.1.XXX:8081
exp://localhost:8081
```

**For Production (Native App):**
```
focus:///(auth)/signin
focus://auth/callback
```

**For Web (if needed):**
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

### Step 2: Configure Google OAuth Provider

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** provider
3. Enable it if not already enabled
4. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

### Step 3: Configure Google Cloud Console

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret** to Supabase

### Step 4: Test the Flow

1. The app uses `focus://` scheme (configured in `app.json`)
2. When user clicks "Continue with Google":
   - App opens browser with Google login
   - User signs in with Google
   - Google redirects to Supabase callback
   - Supabase redirects back to app via deep link: `focus:///(auth)/signin`
   - App detects the deep link and completes authentication

### Troubleshooting

**If Google login still doesn't work:**

1. Check Supabase logs: **Authentication** → **Logs**
2. Check app logs for OAuth errors
3. Verify redirect URLs match exactly (including trailing slashes)
4. Make sure Google OAuth credentials are correct in Supabase
5. Test deep linking: The app should handle `focus://` URLs

## Current Implementation

The app already has:
- ✅ Deep linking configured (`focus://` scheme)
- ✅ OAuth handler in `app/_layout.tsx`
- ✅ Google sign-in button in `app/(auth)/signin.tsx`
- ✅ OAuth flow in `src/store/auth-store.ts`

The main issue is likely missing redirect URLs in Supabase configuration.

# 🔧 Fix OAuth Redirect to Localhost Issue

## 🔍 Problem

After Google sign-in, browser redirects to `localhost` instead of back to the app.

## 🎯 Root Cause

Using Supabase callback URL (`/auth/v1/callback`) causes Supabase to redirect to localhost instead of the app scheme.

## ✅ Solution

**Use app scheme directly** as `redirectTo` instead of callback URL.

### Changes Made:

- **Before:** `redirectTo: callbackUrl` (Supabase callback)
- **After:** `redirectTo: appRedirectUrl` (App scheme: `focus:///(auth)/signin`)

---

## 📋 Required: Configure Supabase Redirect URLs

**Important:** You must add the app scheme URL to Supabase's allowed redirect URLs:

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Click **"Authentication"** → **"URL Configuration"**
3. Under **"Redirect URLs"**, add:
   ```
   focus:///(auth)/signin
   exp://192.168.0.223:8081/--/(auth)/signin
   ```
4. Click **"Save"**

**Note:** The callback URL (`/auth/v1/callback`) is automatically allowed, but we're not using it for mobile OAuth.

---

## 🔄 How It Works Now

1. **User clicks "Continue with Google"**
   - App generates OAuth URL with `redirectTo: focus:///(auth)/signin`
   - Browser opens with Google sign-in

2. **User signs in with Google**
   - Google processes authentication
   - Redirects to Supabase with auth code

3. **Supabase processes OAuth**
   - Validates the OAuth response
   - Creates/updates user session
   - Redirects directly to app: `focus:///(auth)/signin`

4. **App receives deep link**
   - Deep link handler detects OAuth callback
   - Parses session from URL
   - Updates auth state

5. **User is signed in** ✅

---

## 🐛 Troubleshooting

### If Still Redirecting to Localhost:

1. **Check Supabase Redirect URLs:**
   - Make sure `focus:///(auth)/signin` is added
   - No typos in URL
   - URL matches exactly

2. **Check App Scheme:**
   - Verify `app.json` has `"scheme": "focus"`
   - Rebuild app if you changed scheme

3. **Check Deep Link Handling:**
   - Look for `[Deep Link]` logs
   - Verify URL is being received
   - Check if session is being parsed

4. **Try Different Redirect Format:**
   - Try: `focus://auth/signin`
   - Or: `exp://192.168.0.223:8081/--/(auth)/signin` (for development)

---

## 📱 Expected Flow

```
App → Google Sign-In → Supabase → App (focus://)
```

**Not:**
```
App → Google Sign-In → Supabase → Callback → Localhost ❌
```

---

## ✅ Test Checklist

- [ ] Added `focus:///(auth)/signin` to Supabase redirect URLs
- [ ] Restarted app
- [ ] Clicked "Continue with Google"
- [ ] Browser opened
- [ ] Signed in with Google
- [ ] Redirected back to app (not localhost)
- [ ] Successfully signed in

---

## 🆘 Still Not Working?

1. **Check Supabase Logs:**
   - Authentication → Logs
   - Look for OAuth events
   - Check redirect URL used

2. **Check App Logs:**
   - Look for `[Auth]` and `[Deep Link]` messages
   - Check if deep link is received
   - Check if session is parsed

3. **Verify App Scheme:**
   - Check `app.json` → `"scheme": "focus"`
   - Test deep link manually: `focus:///(auth)/signin`

4. **Alternative: Use Expo URL for Development:**
   - For development, you can use: `exp://192.168.0.223:8081/--/(auth)/signin`
   - Add this to Supabase redirect URLs
   - This works better in development mode


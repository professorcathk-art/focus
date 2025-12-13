# 🔧 Fix Google OAuth Loading Issue

## 🔍 Problem

Google OAuth keeps loading and doesn't complete the sign-in flow.

## 🎯 Root Cause

1. **Redirect URL Issue:** Using `exp://` scheme which Supabase might not handle properly
2. **Deep Link Parsing:** OAuth callback URL fragments not being parsed correctly
3. **Session Detection:** Supabase not detecting session after OAuth redirect

## ✅ Solution Applied

### Changes Made:

1. **Updated Redirect URL:**
   - Now uses Supabase callback URL: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
   - This URL properly handles OAuth flow
   - Then redirects to app scheme: `focus:///(auth)/signin`

2. **Improved Deep Link Handling:**
   - Better detection of OAuth callbacks
   - Properly parses URL fragments and query params
   - Handles errors from OAuth flow
   - Retries session check if needed

3. **Enhanced Session Detection:**
   - Improved error handling
   - Better logging for debugging
   - Automatic retry mechanism

---

## 🔧 Additional Configuration Needed

### Step 1: Configure Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Click **"Authentication"** → **"URL Configuration"**
3. Under **"Redirect URLs"**, add:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   focus:///(auth)/signin
   exp://192.168.0.223:8081/--/(auth)/signin
   ```

4. Click **"Save"**

### Step 2: Verify Google OAuth Settings

1. Go to: **Authentication** → **Providers** → **Google**
2. Verify:
   - ✅ Google provider is enabled
   - ✅ Client ID is correct
   - ✅ Client Secret is correct
   - ✅ Redirect URLs match

### Step 3: Test Again

1. Restart your app
2. Try Google sign-in again
3. Check logs for detailed debugging info

---

## 🐛 Troubleshooting

### If Still Not Working:

1. **Check Supabase Logs:**
   - Go to: **Authentication** → **Logs**
   - Look for OAuth events
   - Check for errors

2. **Check Browser Console:**
   - When browser opens for Google sign-in
   - Check for JavaScript errors
   - Check network requests

3. **Verify Redirect URLs:**
   - Make sure all redirect URLs are added in Supabase
   - No typos in URLs
   - URLs match exactly

4. **Test with Different Redirect:**
   - Try using just the callback URL
   - Or try using just the app scheme
   - See which one works

---

## 📋 Expected Flow

1. **User clicks "Continue with Google"**
   - App initiates OAuth flow
   - Browser opens with Google sign-in

2. **User signs in with Google**
   - Google processes authentication
   - Redirects to Supabase callback URL

3. **Supabase processes OAuth**
   - Validates the OAuth response
   - Creates/updates user session
   - Redirects to app scheme

4. **App receives deep link**
   - Deep link handler detects OAuth callback
   - Parses session from URL
   - Updates auth state

5. **User is signed in**
   - Session is stored
   - User can use the app

---

## 🔍 Debug Logs

Watch for these logs:

```
[Auth] 🔵 Initiating Google sign in
[Auth] Callback URL: https://...
[Auth] ✅ Google sign in initiated
[Deep Link] Received URL: ...
[Deep Link] 🔐 Auth callback detected
[Deep Link] ✅ Session found, refreshing auth state
[Auth] 🔄 Auth state changed: SIGNED_IN
```

If you see errors, check:
- OAuth URL format
- Redirect URL configuration
- Session parsing

---

## 💡 Alternative: Use Web Redirect Page

If deep links still don't work, create a web redirect page:

1. **Create HTML page** that redirects to app:
   ```html
   <script>
     window.location.href = 'focus:///(auth)/signin';
   </script>
   ```

2. **Host it** (e.g., on Vercel, Netlify)

3. **Use as redirect URL** in Supabase

---

## 🆘 Still Not Working?

1. **Check Supabase Dashboard:**
   - Authentication → Logs
   - Look for OAuth events

2. **Check App Logs:**
   - Look for `[Auth]` and `[Deep Link]` messages
   - Check for errors

3. **Try Email/Password:**
   - If that works, issue is OAuth-specific
   - Focus on OAuth configuration

4. **Test in Production:**
   - Sometimes dev URLs don't work well
   - Try building and testing production app


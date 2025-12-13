# 🔧 Fix Google OAuth Redirect URI Issue

## 🔍 Problem

After selecting Google account, browser goes to Site URL (`https://wqvevludffkemgicrfos.supabase.co`) and shows "requested path is invalid".

## 🎯 Root Cause

**Google Cloud Console** has the wrong redirect URI configured. Google is redirecting to the Site URL instead of the Supabase callback URL.

## ✅ Solution: Fix Google Cloud Console Redirect URI

### Step 1: Go to Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project (or create one)
3. Go to **"APIs & Services"** → **"Credentials"**
4. Find your **OAuth 2.0 Client ID** (Web application type)
5. Click to edit it

### Step 2: Update Authorized Redirect URIs

In the **"Authorized redirect URIs"** section, make sure you have:

```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

**Remove any incorrect URIs like:**
- ❌ `https://wqvevludffkemgicrfos.supabase.co` (base URL - wrong!)
- ❌ `http://localhost:3001` (if you have this)
- ❌ Any other incorrect URLs

**Keep only:**
- ✅ `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`

### Step 3: Save Changes

1. Click **"Save"**
2. Wait a few seconds for changes to propagate

---

## 🔍 How to Verify

### Check the OAuth URL

When you click "Continue with Google", check the logs. The OAuth URL should contain:
```
redirect_to=https%3A%2F%2Fwqvevludffkemgicrfos.supabase.co%2Fauth%2Fv1%2Fcallback
```

If it shows the base URL instead, Google Cloud Console is overriding it.

---

## 📋 Complete Checklist

### Supabase Configuration:
- [ ] Site URL: `https://wqvevludffkemgicrfos.supabase.co` (base URL only)
- [ ] Redirect URLs includes: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`

### Google Cloud Console:
- [ ] OAuth Client ID (Web application) exists
- [ ] Authorized redirect URI: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
- [ ] No incorrect redirect URIs (like base URL)

### Supabase Google Provider:
- [ ] Google provider enabled
- [ ] Client ID matches Google Cloud Console
- [ ] Client Secret matches Google Cloud Console

---

## 🔄 Expected Flow After Fix

1. **User clicks "Continue with Google"**
   - OAuth URL generated with callback URL
   - Browser opens

2. **User selects Google account**
   - Google redirects to: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
   - ✅ Not the base URL!

3. **Supabase processes OAuth**
   - Creates session
   - Shows success page

4. **User opens app**
   - App detects session
   - User signed in ✅

---

## 🐛 If Still Not Working

### Check Google Cloud Console Logs:
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Check **"Authorized domains"**
3. Make sure `supabase.co` is authorized (or add it)

### Verify Redirect URI Format:
- Must be exact match: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
- No trailing slashes
- HTTPS only (not HTTP)

### Test the Redirect URI:
1. Copy the callback URL
2. Try opening it in browser (will show error, but confirms it's accessible)
3. Should not redirect to base URL

---

## 💡 Why This Happens

Google OAuth validates redirect URIs against what's configured in Google Cloud Console. If the callback URL isn't in the authorized list, Google falls back to the Site URL or rejects the request.

**The fix:** Add the exact callback URL to Google Cloud Console's authorized redirect URIs.


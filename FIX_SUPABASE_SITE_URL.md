# 🔧 Fix Supabase Site URL Configuration

## 🔍 Problem

After changing Site URL, getting "requested path is invalid" error.

## ✅ Solution: Reset Site URL

### Step 1: Reset Site URL in Supabase

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Click **"Authentication"** → **"URL Configuration"**
3. Set **"Site URL"** back to:
   ```
   https://wqvevludffkemgicrfos.supabase.co
   ```
   (This is the default - just the base Supabase URL)

4. Click **"Save"**

### Step 2: Configure Redirect URLs

Under **"Redirect URLs"**, make sure you have:
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

**Important:** 
- Site URL = Base Supabase URL (for general redirects)
- Redirect URLs = Specific callback URLs (for OAuth)

---

## 🔄 How Supabase OAuth Works

1. **Site URL** = Default redirect location (base URL)
2. **Redirect URLs** = Allowed OAuth callback URLs
3. **OAuth Flow:**
   - Google → Supabase callback (`/auth/v1/callback`)
   - Supabase processes OAuth
   - Supabase redirects to Site URL (or specified redirect_to)

---

## 🎯 Correct Configuration

### Site URL:
```
https://wqvevludffkemgicrfos.supabase.co
```

### Redirect URLs (add these):
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

### Additional Redirect URLs (for app deep links - if Supabase supports):
- Try adding: `focus:///(auth)/signin` (might not work)
- Or use callback URL only (current approach)

---

## 🔧 Alternative: Use Query Parameter Redirect

The code already uses `queryParams.redirect_to` to tell Supabase where to redirect after OAuth. This should work with the callback URL.

**Current flow:**
1. OAuth uses callback URL
2. Query param `redirect_to` tells Supabase where to redirect next
3. Supabase should redirect to that URL

**If it's not working:**
- Supabase might not support app schemes in query params
- Need to use web redirect page instead

---

## 🚀 Quick Fix

1. **Reset Site URL** to base Supabase URL
2. **Add callback URL** to redirect URLs
3. **Test again**

The "requested path is invalid" error suggests the Site URL or redirect path is wrong. Reset Site URL to default and it should work.


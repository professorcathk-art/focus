# Step-by-Step Supabase Fix - Copy/Paste Values

## ⚠️ Critical: Check These Exact Settings

### Step 1: Open Supabase URL Configuration

Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos/auth/url-configuration

### Step 2: Set Site URL (CRITICAL - Most Common Issue)

**Field Name**: "Site URL"

**Copy and paste this EXACT value:**
```
https://wqvevludffkemgicrfos.supabase.co
```

**Click "Save"**

**⚠️ Common mistakes:**
- ❌ Leaving it empty
- ❌ Using `http://` instead of `https://`
- ❌ Adding `/auth/v1/callback` (Site URL should NOT include path)
- ❌ Using `localhost` or your app URL

### Step 3: Add Redirect URL

**Field Name**: "Redirect URLs"

**Click "Add URL" or "+" button**

**Copy and paste this EXACT value:**
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

**Click "Save" or "Add"**

**⚠️ Must match EXACTLY:**
- ✅ Starts with `https://`
- ✅ No trailing slash
- ✅ Includes `/auth/v1/callback`
- ✅ No spaces before or after

### Step 4: Verify Both Settings

After saving, verify you see:

**Site URL:**
```
https://wqvevludffkemgicrfos.supabase.co
```

**Redirect URLs list includes:**
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

### Step 5: Check Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Click to edit
4. Under **"Authorized redirect URIs"**, verify this is listed:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
5. If NOT listed, add it and **Save**

### Step 6: Test

1. Try email signup → Should work ✅
2. Try Google login → Should work ✅

## Still Not Working?

### Check Supabase Auth Logs

1. Go to: Supabase Dashboard → Logs → Auth Logs
2. Try Google login again
3. Look for the error message
4. **Copy the exact error message** and share it

### Check What URL Is Being Sent

The error might show what URL Supabase is rejecting. Look for:
- The exact URL in the error
- Any query parameters being added
- Any differences from what you configured

## Most Likely Issues

1. **Site URL not set** → Set to `https://wqvevludffkemgicrfos.supabase.co`
2. **Redirect URL typo** → Check for trailing slash, http vs https, exact path
3. **Google Cloud Console mismatch** → Verify redirect URI matches exactly
4. **Settings not saved** → Make sure you clicked "Save" after changes

## Quick Test

After fixing, test this URL in browser:
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

Should show Supabase auth page (not error page).


# Exact Supabase Settings to Fix Redirect Error

## Your Exact Configuration

### Supabase Dashboard URL:
https://supabase.com/dashboard/project/wqvevludffkemgicrfos/auth/url-configuration

## Step-by-Step Fix

### 1. Site URL (MOST IMPORTANT)

**Field**: Site URL
**Value**: 
```
https://wqvevludffkemgicrfos.supabase.co
```

**Why**: This is the base URL Supabase uses to validate redirects. If this is wrong, ALL redirects fail.

### 2. Redirect URLs

**Field**: Redirect URLs
**Add this EXACT URL** (no trailing slash, no spaces):
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

**How to add:**
1. Click "Add URL" or "+" button
2. Paste the URL above
3. Click "Save" or "Add"
4. Verify it appears in the list

### 3. Additional Redirect URLs (Optional but Recommended)

You can also add these for better compatibility:
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback#
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback?*
```

But the main one above should be enough.

## Verify Settings

After saving, verify:
1. Site URL shows: `https://wqvevludffkemgicrfos.supabase.co`
2. Redirect URLs list includes: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
3. No extra characters or spaces
4. All URLs use `https://` not `http://`

## Test Immediately

After saving:
1. Try email signup → Should work ✅
2. Try Google login → Should work ✅

**No rebuild needed!** Configuration changes take effect immediately.

## If Error Persists

Check Supabase Auth Logs:
1. Go to: Supabase Dashboard → Logs → Auth Logs
2. Look for the exact error message
3. Check what URL is being rejected
4. Verify that URL matches what's in Redirect URLs list


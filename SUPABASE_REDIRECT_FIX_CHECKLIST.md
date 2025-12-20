# Supabase Redirect Fix - Quick Checklist

## ⚠️ Root Cause
Both email signup and Google OAuth fail because Supabase callback URL is not in allowed redirect URLs.

## ✅ Fix Steps (5 minutes, no rebuild needed)

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos/auth/url-configuration

### 2. Add Redirect URL
- Scroll to **"Redirect URLs"** section
- Click **"Add URL"** or **"+"**
- Paste exactly: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
- Click **"Save"**

### 3. Verify Site URL
- Check **"Site URL"** field
- Should be: `https://wqvevludffkemgicrfos.supabase.co`
- If different, update it and **Save**

### 4. Test Immediately
- Try email signup → Should work ✅
- Try Google OAuth → Should work ✅

**No rebuild needed!** Configuration changes take effect immediately.

## 🔍 What to Check

### Redirect URLs List Should Include:
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

### Site URL Should Be:
```
https://wqvevludffkemgicrfos.supabase.co
```

## ❌ Common Errors

- URL has trailing slash: `/callback/` ❌
- Missing `/auth/v1/`: `/callback` ❌
- Using `http://` instead of `https://` ❌
- URL not in the list at all ❌

## ✅ After Fix

Both email signup and Google OAuth should work immediately without rebuilding the app.


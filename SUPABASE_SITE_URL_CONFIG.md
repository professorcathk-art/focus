# 🔧 Supabase Site URL Configuration

## ✅ Correct Site URL

**Set Site URL to:**
```
https://wqvevludffkemgicrfos.supabase.co
```

**This is:** Your base Supabase project URL (no `/auth/v1/callback`)

---

## 📋 Complete Supabase Configuration

### Site URL:
```
https://wqvevludffkemgicrfos.supabase.co
```
- ✅ Base Supabase URL only
- ✅ No paths (no `/auth/v1/callback`)
- ✅ HTTPS protocol
- ✅ Used as default redirect location

### Redirect URLs (add these):
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```
- ✅ Full callback path
- ✅ Used for OAuth redirects
- ✅ Must be in the list

---

## 🎯 What Each Setting Does

### Site URL:
- **Purpose:** Default redirect location for auth flows
- **Used when:** No specific redirect URL is provided
- **Should be:** Base Supabase URL

### Redirect URLs:
- **Purpose:** Allowed OAuth callback URLs
- **Used when:** OAuth providers redirect back
- **Should include:** Callback URL (`/auth/v1/callback`)

---

## ⚠️ Common Mistakes

### ❌ Wrong Site URL:
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```
- Includes callback path (wrong!)

### ❌ Wrong Site URL:
```
focus://
```
- App scheme (not a valid web URL)

### ✅ Correct Site URL:
```
https://wqvevludffkemgicrfos.supabase.co
```
- Base URL only (correct!)

---

## 🔍 How to Verify

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/wqvevludffkemgicrfos
   - Authentication → URL Configuration

2. **Check Site URL:**
   - Should be: `https://wqvevludffkemgicrfos.supabase.co`
   - Should NOT include `/auth/v1/callback`

3. **Check Redirect URLs:**
   - Should include: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
   - Can have multiple URLs (one per line)

---

## 📝 Summary

**Site URL = Base Supabase URL**
- Used for general redirects
- Default fallback location
- Should be: `https://wqvevludffkemgicrfos.supabase.co`

**Redirect URLs = Specific Callback URLs**
- Used for OAuth flows
- Must include callback path
- Should include: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`

---

## ✅ Quick Setup

1. **Site URL:** `https://wqvevludffkemgicrfos.supabase.co`
2. **Redirect URLs:** `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
3. **Save**

That's it! Keep it simple.


# Comprehensive Redirect URL Diagnosis

## Error: "required path is invalid" or "requested path is invalid"

This error can come from **two places**:
1. **Supabase** - if redirect URL not in allowed list
2. **Google Cloud Console** - if redirect URI doesn't match

## Step 1: Verify Exact Error Source

Check where the error appears:
- **In browser after Google login?** → Google Cloud Console issue
- **In app after clicking email link?** → Supabase redirect URL issue
- **In Supabase logs?** → Supabase configuration issue

## Step 2: Check Supabase Configuration

### A. Site URL (CRITICAL)

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos/auth/url-configuration
2. Check **"Site URL"** field
3. **It MUST be set to:**
   ```
   https://wqvevludffkemgicrfos.supabase.co
   ```
   **NOT**:
   - `http://` (must be https)
   - `localhost`
   - Empty
   - Your app's deep link (`focus://`)

### B. Redirect URLs

1. In the same page, check **"Redirect URLs"** section
2. **Must include EXACTLY:**
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
3. **Common mistakes:**
   - ❌ Trailing slash: `/callback/`
   - ❌ Missing `/auth/v1/`: `/callback`
   - ❌ Using `http://` instead of `https://`
   - ❌ Extra spaces or line breaks

### C. Verify URL Format

The URL must match **exactly**:
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```

**Test the URL:**
- Open in browser: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
- Should show Supabase auth page (not 404)

## Step 3: Check Google Cloud Console

### A. Authorized Redirect URIs

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your **OAuth 2.0 Client ID** (the one used by Supabase)
3. Click to edit
4. Under **"Authorized redirect URIs"**, check if this is listed:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```
5. **If NOT listed**, add it and **Save**

### B. Authorized JavaScript Origins

Should include:
```
https://wqvevludffkemgicrfos.supabase.co
```

## Step 4: Check Supabase Google Provider Settings

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos/auth/providers
2. Click on **"Google"** provider
3. Verify:
   - ✅ Provider is **Enabled**
   - ✅ **Client ID** is set (from Google Cloud Console)
   - ✅ **Client Secret** is set (from Google Cloud Console)
4. **Save** if you made changes

## Step 5: Common Issues & Fixes

### Issue 1: Site URL Not Set
**Symptom**: All redirects fail
**Fix**: Set Site URL to `https://wqvevludffkemgicrfos.supabase.co`

### Issue 2: Redirect URL Not in List
**Symptom**: "requested path is invalid" from Supabase
**Fix**: Add `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback` to Redirect URLs

### Issue 3: Google Redirect URI Mismatch
**Symptom**: "redirect_uri_mismatch" error
**Fix**: Add callback URL to Google Cloud Console Authorized Redirect URIs

### Issue 4: Site URL Mismatch
**Symptom**: Redirects work but session not detected
**Fix**: Ensure Site URL matches the domain in redirect URLs

## Step 6: Test Configuration

### Test 1: Direct URL Access
Open in browser:
```
https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
```
Should show Supabase auth page (not error)

### Test 2: Check Supabase Logs
1. Go to: Supabase Dashboard → Logs → Auth Logs
2. Try Google login
3. Check for specific error messages
4. Look for the exact URL being rejected

### Test 3: Check Google Cloud Console Logs
1. Go to: Google Cloud Console → APIs & Services → Credentials
2. Click on your OAuth client
3. Check "OAuth consent screen" for any errors

## Step 7: Exact Configuration Checklist

### Supabase Settings:
- [ ] Site URL: `https://wqvevludffkemgicrfos.supabase.co`
- [ ] Redirect URLs includes: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
- [ ] No trailing slashes
- [ ] All URLs use `https://` not `http://`

### Google Cloud Console:
- [ ] Authorized Redirect URIs includes: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`
- [ ] Authorized JavaScript Origins includes: `https://wqvevludffkemgicrfos.supabase.co`
- [ ] OAuth Client ID matches Supabase Google provider settings

### Supabase Google Provider:
- [ ] Provider is Enabled
- [ ] Client ID matches Google Cloud Console
- [ ] Client Secret matches Google Cloud Console

## If Still Not Working

1. **Check Supabase Auth Logs** for exact error
2. **Check browser console** when error occurs
3. **Verify the exact URL** being sent (check app logs)
4. **Try disabling email confirmation** temporarily to isolate issue


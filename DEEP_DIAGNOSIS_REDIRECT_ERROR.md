# Deep Diagnosis: "Requested Path is Invalid" Error

## Understanding "Base Domain"

**Base domain** = The root URL without any path
- ✅ Correct: `https://wqvevludffkemgicrfos.supabase.co`
- ❌ Wrong: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback` (has path)
- ❌ Wrong: `https://focus-psi-one.vercel.app` (Vercel backend - wrong!)

**Site URL should be**: Your Supabase project URL (not Vercel backend)

## The Real Issue: Query Parameters

Supabase adds query parameters to redirect URLs:
- `?code=...`
- `#access_token=...`
- `?error=...`

If your redirect URL doesn't account for these, it might fail.

## Step-by-Step Deep Diagnosis

### Step 1: Check Where Error Appears

**A. In Browser After Google Login?**
- Error appears in browser → **Google Cloud Console** issue
- Check Google Cloud Console → Authorized Redirect URIs

**B. In App After Email Confirmation?**
- Error appears in app → **Supabase** issue
- Check Supabase → Redirect URLs

**C. In Supabase Logs?**
- Check Supabase Dashboard → Logs → Auth Logs
- Look for exact error message

### Step 2: Check Exact Error Format

The error `{"error": "required path is invalid"}` - note it says "required" not "requested"

**This might be a different error!** Check:
1. Is it `"required path is invalid"` or `"requested path is invalid"`?
2. Where exactly does this error appear?
3. What's the full error response?

### Step 3: Verify Supabase Configuration with Wildcards

Try adding redirect URLs with wildcards to handle query parameters:

**In Supabase → Redirect URLs, add ALL of these:**

1. Base URL:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```

2. With query parameter wildcard:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback?*
   ```

3. With hash fragment:
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback#*
   ```

### Step 4: Check Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Check **"Authorized redirect URIs"**
4. **Must include EXACTLY:**
   ```
   https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback
   ```

### Step 5: Check Supabase Google Provider

1. Go to: Supabase Dashboard → Authentication → Providers → Google
2. Verify:
   - ✅ Enabled
   - ✅ Client ID matches Google Cloud Console
   - ✅ Client Secret matches Google Cloud Console
3. **Save** if you made changes

## Alternative: Use Deep Link Instead

For React Native apps, you might need to use a deep link that Supabase can redirect to:

### Option 1: Add Deep Link to Redirect URLs

In Supabase → Redirect URLs, also add:
```
focus://auth/callback
```

Then update code to use deep link after Supabase callback.

### Option 2: Use Supabase Callback + Deep Link Handler

Keep using Supabase callback URL, but create a web page that redirects to app deep link.

## Most Likely Issues

1. **Query parameters breaking match** → Add wildcard URLs
2. **Google Cloud Console mismatch** → Verify redirect URI matches exactly
3. **Site URL wrong** → Should be Supabase URL, not Vercel
4. **Error coming from Google, not Supabase** → Check Google Cloud Console

## Next Steps

1. **Check exact error message** - is it "required" or "requested"?
2. **Check where error appears** - browser or app?
3. **Add wildcard redirect URLs** in Supabase
4. **Verify Google Cloud Console** redirect URI
5. **Check Supabase Auth Logs** for exact error


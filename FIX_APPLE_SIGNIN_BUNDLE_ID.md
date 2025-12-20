# Fix Apple Sign-In Bundle Identifier Error

## Error Message
"Apple sign in requires a developer build. Expo Go users a different bundle identifier."

## Root Cause
Supabase is rejecting the Apple Sign-In token because the bundle identifier in the token doesn't match what's configured in Supabase.

## Solution: Verify Supabase Configuration

### Step 1: Check Supabase Apple Sign-In Settings

1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Apple**

2. Verify these settings:
   - **Client ID**: Should be `com.focuscircle.signin` (your Service ID)
   - **Secret Key**: Should be the JWT you generated (not the .p8 file)
   - **Team ID**: `YUNUL5V5R6`
   - **Key ID**: `U3ZQ3S6AK6`

### Step 2: Verify Apple Developer Portal

1. Go to **Apple Developer Portal** → **Certificates, Identifiers & Profiles** → **Identifiers**

2. Find your **Service ID**: `com.focuscircle.signin`

3. Make sure:
   - ✅ Service ID is enabled
   - ✅ Sign in with Apple is enabled
   - ✅ Primary App ID is set to: `com.focuscircle`
   - ✅ Return URLs include: `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback`

### Step 3: Check App Bundle Identifier

Your app's bundle identifier should be: `com.focuscircle`

Verify in:
- `app.json` → `ios.bundleIdentifier`: `com.focuscircle`
- Apple Developer Portal → App ID: `com.focuscircle`

### Step 4: Common Issues

#### Issue 1: Wrong Client ID in Supabase
- **Symptom**: Error mentions "Unacceptable audience"
- **Fix**: Make sure Supabase Client ID = `com.focuscircle.signin` (Service ID, not App ID)

#### Issue 2: Service ID Not Configured
- **Symptom**: Apple Sign-In fails immediately
- **Fix**: Create Service ID in Apple Developer Portal if missing

#### Issue 3: Return URL Mismatch
- **Symptom**: Redirect errors
- **Fix**: Add `https://wqvevludffkemgicrfos.supabase.co/auth/v1/callback` to Service ID return URLs

## Quick Checklist

- [ ] Supabase Client ID = `com.focuscircle.signin`
- [ ] Supabase Secret Key = Generated JWT (not .p8 file)
- [ ] Apple Service ID = `com.focuscircle.signin` exists and enabled
- [ ] Apple App ID = `com.focuscircle` exists
- [ ] Service ID Primary App ID = `com.focuscircle`
- [ ] Service ID Return URLs include Supabase callback URL
- [ ] App bundle identifier = `com.focuscircle`

## Test After Fixing

1. Try Apple Sign-In again
2. Check the error message - it should now show more details
3. If still failing, check Supabase logs for the exact error

## Need Help?

If the error persists, check:
1. Supabase Dashboard → Logs → Auth logs
2. Look for the exact error message
3. Verify the bundle identifier in the error matches your configuration


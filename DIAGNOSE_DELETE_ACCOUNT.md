# Diagnose Delete Account Issue

## Problem
Deleted accounts can still log in with email without signing up again. This means the auth user is NOT being deleted from Supabase.

## Root Cause Analysis

The backend code calls `supabase.auth.admin.deleteUser(userId)`, but if this fails, the user can still log in.

## Steps to Diagnose

### 1. Check Vercel Logs

After attempting to delete an account, check Vercel logs for:

```
[Delete Account] Attempting to delete auth user: <userId>
[Delete Account] ❌ Error deleting auth user: ...
```

Look for:
- Error messages
- Status codes
- Whether `deleteUser` is being called at all

### 2. Verify Service Role Key in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `SUPABASE_SERVICE_ROLE_KEY` exists
3. Check that it starts with `sb_secret_` (newer format) or `eyJ...` (older format)
4. Make sure it's NOT the anon key (which starts with `sb_publishable_`)

### 3. Test Service Role Key

The service role key should have admin access. If it's wrong, `deleteUser` will fail with a permission error.

### 4. Check Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Try to delete an account
3. Check if the user still exists in the list after deletion
4. If the user still exists, `deleteUser` is failing

## Common Issues

### Issue 1: Wrong Key Type
- **Symptom**: `deleteUser` fails with "insufficient permissions"
- **Fix**: Make sure you're using the **service_role** key, not the **anon** key

### Issue 2: Key Not Set in Vercel
- **Symptom**: `deleteUser` fails with "Missing Supabase environment variables"
- **Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables

### Issue 3: Key Format Issue
- **Symptom**: `deleteUser` fails with authentication error
- **Fix**: Verify the key is copied correctly (no extra spaces, complete key)

### Issue 4: Supabase API Version
- **Symptom**: `admin.deleteUser` doesn't exist
- **Fix**: Make sure you're using `@supabase/supabase-js` version 2.x or later

## Testing After Fix

1. Create a test account
2. Log in
3. Delete account (double confirmation)
4. Try to log in again with the same email
5. **Expected**: Login should fail (user not found or invalid credentials)
6. **If login succeeds**: `deleteUser` is still failing - check Vercel logs

## Next Steps

If `deleteUser` is still failing after verifying the service role key:

1. Check Vercel logs for the exact error message
2. Verify Supabase Admin API is enabled for your project
3. Try manually deleting a user from Supabase Dashboard → Authentication → Users
4. If manual deletion works but API doesn't, there's a configuration issue


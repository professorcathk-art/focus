# Verify Delete Account Functionality

## Problem
Users can still sign in after deleting their account, which means the auth user is not being deleted from Supabase.

## Root Cause
The `supabase.auth.admin.deleteUser()` function requires the `SUPABASE_SERVICE_ROLE_KEY` to be configured in Vercel. If this key is missing or incorrect, the auth user deletion will fail silently.

## Verification Steps

### 1. Check Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Your Supabase Service Role Key (starts with `eyJ...`)
   - **Environment**: Production, Preview, Development (all)
   - **Note**: This is different from `SUPABASE_ANON_KEY`!

### 2. Get Your Supabase Service Role Key
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Under **Project API keys**, find **`service_role`** key
4. **⚠️ WARNING**: This key has admin privileges - keep it secret!
5. Copy the key (it's a long JWT token)

### 3. Set in Vercel
1. In Vercel, add/update the environment variable:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
2. Make sure it's set for **all environments** (Production, Preview, Development)
3. **Redeploy** your Vercel app after adding/updating the variable

### 4. Test Delete Account
1. Create a test account
2. Delete the account using the app
3. Check Vercel logs for:
   - `[Delete Account] ✅ Auth user deleted successfully`
   - If you see `[Delete Account] ❌ Error deleting auth user`, check the error message
4. Try to sign in with the deleted account - it should **fail**

### 5. Verify in Supabase Dashboard
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Search for the deleted user's email
3. The user should **NOT** be in the list
4. If the user is still there, the deletion failed

## Common Issues

### Issue 1: Service Role Key Not Set
**Symptoms**: 
- Vercel logs show: `SUPABASE_SERVICE_ROLE_KEY missing`
- Auth user deletion fails
- Users can still sign in

**Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables

### Issue 2: Wrong Key Used
**Symptoms**:
- Using `SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`
- Admin API calls fail with 401/403 errors

**Fix**: Use the **service_role** key, not the **anon** key

### Issue 3: Key Not Redeployed
**Symptoms**:
- Key is set in Vercel but deletion still fails
- Old code is running without the key

**Fix**: **Redeploy** your Vercel app after adding/updating environment variables

## Backend Code Verification

The backend code in `backend/routes/user.js` should:
1. ✅ Check if `SUPABASE_SERVICE_ROLE_KEY` is configured
2. ✅ Call `supabase.auth.admin.signOut(userId, 'global')` to revoke tokens
3. ✅ Call `supabase.auth.admin.deleteUser(userId)` to delete auth user
4. ✅ Verify deletion succeeded before returning success
5. ✅ Return error if auth user deletion fails

## Frontend Code Verification

The frontend code in `app/(tabs)/profile.tsx` should:
1. ✅ Call `apiClient.delete(API_ENDPOINTS.user.delete)`
2. ✅ Sign out immediately after deletion
3. ✅ Clear Supabase session
4. ✅ Redirect to sign-in page
5. ✅ Show error if deletion fails

## Testing Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- [ ] Vercel app has been redeployed after setting the key
- [ ] Backend logs show successful auth user deletion
- [ ] Deleted user cannot sign in again
- [ ] Deleted user is removed from Supabase Auth dashboard
- [ ] User data (ideas, todos, clusters) is deleted
- [ ] User is redirected to sign-in page after deletion

## Next Steps

1. **Verify** `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
2. **Redeploy** your Vercel app
3. **Test** delete account functionality
4. **Check** Vercel logs for any errors
5. **Verify** deleted users cannot sign in

---

**If deletion still fails after verifying the above, check Vercel logs for the specific error message.**


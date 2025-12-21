# Supabase Delete Account Setup

## Problem
When a user deletes their account, the backend only deletes data from database tables but **does not delete the auth user** from Supabase's `auth.users` table. This means users can still log in even after "deleting" their account.

## Solution
The backend now uses Supabase Admin API to delete the auth user. This requires the **Service Role Key** to be configured.

## Required Setup

### 1. Get Your Supabase Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find **Service Role Key** (under "Project API keys")
5. Copy this key (it starts with `eyJ...`)

⚠️ **IMPORTANT**: The Service Role Key bypasses Row Level Security (RLS). Keep it secret and never expose it to the frontend!

### 2. Set Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Paste your Service Role Key
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**

### 3. Verify Backend Configuration

The backend code (`backend/lib/supabase.js`) should already be configured to use the service role key:

```javascript
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

### 4. Test Delete Account

After setting up the environment variable:

1. Create a test account
2. Log in
3. Go to Profile → Delete Account
4. Confirm deletion (double confirmation)
5. Try to log in again with the same credentials
6. **Expected**: Login should fail because the auth user was deleted

## How It Works

1. User clicks "Delete Account" → Double confirmation
2. Frontend calls `DELETE /api/user/delete`
3. Backend:
   - Deletes all user data (ideas, clusters, todos, users table)
   - **Deletes auth user** using `supabase.auth.admin.deleteUser(userId)`
4. User is signed out and redirected to sign-in page
5. User cannot log in anymore (auth user deleted)

## Troubleshooting

### Error: "Service Role Key not found"
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel environment variables
- Redeploy your Vercel project after adding the variable

### Error: "Insufficient permissions"
- Verify you're using the **Service Role Key**, not the **Anon Key**
- Service Role Key starts with `eyJ...` and is much longer than the Anon Key

### User can still log in after deletion
- Check Vercel logs to see if `auth.admin.deleteUser()` succeeded
- Verify the Service Role Key is correct
- Check Supabase Dashboard → Authentication → Users to see if the user still exists

## Security Note

The Service Role Key has **full admin access** to your Supabase project. It can:
- Bypass Row Level Security (RLS)
- Read/write any data
- Delete any user
- Modify any table

**Never** expose this key to:
- Frontend code
- Client-side JavaScript
- Public repositories
- Environment variables in frontend builds

Only use it in:
- Backend/server-side code
- Secure server environment variables
- Vercel serverless functions (backend)


# 🔧 Fix "Database error saving new user" After Deleting User

## 🔍 Problem

After deleting a user from Supabase Dashboard, when you try to sign up again with the same email, you get:
```
ERROR [SignUp] Error: Database error saving new user
```

## 🎯 Root Cause

When you delete a user from `auth.users` in Supabase Dashboard:
- The user is removed from `auth.users` ✅
- But the record might still exist in `public.users` ❌
- When you sign up again, Supabase creates a new user with a **new UUID**
- The trigger tries to sync to `public.users` but encounters conflicts

## ✅ Solution: Clean Up Orphaned Records

### Step 1: Run Cleanup SQL

1. Go to: https://supabase.com/dashboard/project/wqvevludffkemgicrfos
2. Click **"SQL Editor"**
3. Copy and paste the contents of `backend/fix-orphaned-users.sql`
4. Click **"Run"**

This will:
- ✅ Delete orphaned users from `public.users`
- ✅ Fix email conflicts
- ✅ Update the trigger function with better error handling

### Step 2: Verify Cleanup

After running the SQL, check the results:
- Look for any rows marked "ORPHANED - DELETE THIS"
- If you see your email, it will be cleaned up

### Step 3: Try Sign Up Again

1. Go back to your app
2. Try signing up again with your email
3. ✅ Should work now!

---

## 🛠️ Manual Fix (If SQL Doesn't Work)

### Option 1: Delete from public.users Directly

1. Go to: **SQL Editor** in Supabase Dashboard
2. Run:
```sql
-- Find your email
SELECT * FROM public.users WHERE email = 'mickeylau.finance@gmail.com';

-- Delete it (replace with your email)
DELETE FROM public.users WHERE email = 'mickeylau.finance@gmail.com';
```

3. Try signing up again

### Option 2: Delete All Orphaned Users

```sql
-- Delete all users from public.users that don't exist in auth.users
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);
```

---

## 🔄 Better Approach: Use Cascade Delete

To prevent this issue in the future, we can set up cascade delete:

```sql
-- This ensures when auth.users is deleted, public.users is also deleted
-- But Supabase doesn't allow direct foreign keys to auth.users
-- So we rely on the trigger to handle cleanup

-- Create a cleanup function
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for deletions
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deleted();
```

**Note:** Supabase might not allow triggers on `auth.users` deletions. The cleanup SQL above is the safer approach.

---

## 📋 Quick Checklist

- [ ] Run `backend/fix-orphaned-users.sql` in Supabase SQL Editor
- [ ] Check for orphaned records in the results
- [ ] Try signing up again
- [ ] If still fails, manually delete from `public.users`

---

## 🆘 Still Not Working?

### Check These:

1. **Email Uniqueness**
   - Check if email exists in `public.users` with different ID
   - Delete the old record

2. **Trigger Function**
   - Verify trigger exists: `on_auth_user_created`
   - Check trigger function: `handle_new_user()`

3. **RLS Policies**
   - Verify RLS policies allow inserts
   - Check if service role has permissions

4. **Check Supabase Logs**
   - Go to: **Logs** → **Postgres Logs**
   - Look for trigger errors

---

## 💡 Prevention

**Best Practice:**
- Don't delete users manually from Supabase Dashboard
- Instead, use a "soft delete" (mark as deleted, don't actually delete)
- Or use the cleanup SQL before deleting

**For Development:**
- Use different test emails each time
- Or clean up `public.users` before deleting from `auth.users`


-- Fix Orphaned Users After Deletion
-- Run this in Supabase SQL Editor to clean up orphaned user records

-- Step 1: Delete orphaned users from public.users that don't exist in auth.users
-- This happens when you delete a user from auth.users but the trigger doesn't clean up public.users
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 2: Also delete users with the same email but different ID (if any)
-- This handles cases where email uniqueness constraint might cause issues
DELETE FROM public.users u1
WHERE EXISTS (
  SELECT 1 FROM auth.users a
  WHERE a.email = u1.email AND a.id != u1.id
);

-- Step 3: Verify the trigger function handles conflicts properly
-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user in public.users
  INSERT INTO public.users (id, email, name, password_hash, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULL, -- password_hash is NULL because Supabase Auth handles passwords
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Error syncing user to public.users: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Check for any remaining orphaned records
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN a.id IS NULL THEN 'ORPHANED - DELETE THIS'
    ELSE 'OK'
  END as status
FROM public.users u
LEFT JOIN auth.users a ON u.id = a.id
ORDER BY u.created_at DESC;


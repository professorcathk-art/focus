-- Supabase Auth Setup
-- This enables Supabase Auth and links it to your users table

-- Enable Supabase Auth (if not already enabled)
-- This is usually enabled by default, but we'll ensure it's set up

-- Create a function to sync auth.users with your users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync auth.users to public.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to work with Supabase Auth
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can insert own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can update own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can delete own ideas" ON ideas;
DROP POLICY IF EXISTS "Users can view own clusters" ON clusters;
DROP POLICY IF EXISTS "Users can insert own clusters" ON clusters;
DROP POLICY IF EXISTS "Users can update own clusters" ON clusters;
DROP POLICY IF EXISTS "Users can delete own clusters" ON clusters;

-- New RLS policies using auth.uid()
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own ideas" ON ideas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas" ON ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas" ON ideas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas" ON ideas
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own clusters" ON clusters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clusters" ON clusters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clusters" ON clusters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clusters" ON clusters
  FOR DELETE USING (auth.uid() = user_id);


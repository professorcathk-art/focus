-- Fix users table for Supabase Auth
-- Run this in Supabase SQL Editor FIRST before running supabase-auth-setup.sql

-- Make password_hash nullable (Supabase Auth handles passwords)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Grant necessary permissions for the trigger function
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;

-- Now run supabase-auth-setup.sql after this


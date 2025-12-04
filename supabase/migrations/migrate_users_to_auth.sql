-- Migration script to create Supabase Auth users from existing User table
-- Run this AFTER creating users in Supabase Auth Dashboard
-- This script creates a function to sync user metadata

-- Function to update user metadata when User table is updated
CREATE OR REPLACE FUNCTION sync_user_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users metadata if user exists
  -- Note: This requires admin access, so it's better to handle in Edge Function
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To migrate existing users:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create users manually OR use the Supabase Admin API
-- 3. Set user_metadata: { name: 'condor', role: 'CREATOR' } etc.
-- 4. Set password to match existing password
-- 5. Use email format: name@wifeapp.local


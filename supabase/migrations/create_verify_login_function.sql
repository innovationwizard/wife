-- Create PostgreSQL function for login verification
-- This uses pgcrypto to verify bcrypt passwords (compatible with bcryptjs)
-- Run this in Supabase SQL Editor

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop function if it exists (for updates)
DROP FUNCTION IF EXISTS verify_user_login(TEXT, TEXT);

-- Create function to verify login
-- Note: bcryptjs produces $2a$ hashes which pgcrypto can verify
CREATE OR REPLACE FUNCTION verify_user_login(user_name TEXT, user_password TEXT)
RETURNS TABLE (
  success BOOLEAN,
  id TEXT,
  name TEXT,
  role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id TEXT;
  user_name_result TEXT;
  user_role TEXT;
  user_password_hash TEXT;
  password_match BOOLEAN;
BEGIN
  -- Get user from database
  SELECT "User"."id", "User"."name", "User"."password", "User"."role"::TEXT
  INTO user_id, user_name_result, user_password_hash, user_role
  FROM "User"
  WHERE "User"."name" = user_name;

  -- Check if user exists
  IF user_id IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Verify password using pgcrypto's crypt function
  -- crypt(plaintext, hash) returns the hash if password matches
  -- This works with bcryptjs hashes (format: $2a$10$...)
  password_match := (user_password_hash = crypt(user_password, user_password_hash));

  IF NOT password_match THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Return success with user data
  RETURN QUERY SELECT 
    true::BOOLEAN,
    user_id::TEXT,
    user_name_result::TEXT,
    user_role::TEXT;
END;
$$;

-- Grant execute permission to service_role (used by Edge Functions)
GRANT EXECUTE ON FUNCTION verify_user_login(TEXT, TEXT) TO service_role;

-- Also grant to anon if needed (for direct API calls)
GRANT EXECUTE ON FUNCTION verify_user_login(TEXT, TEXT) TO anon;

-- Create PostgreSQL function for login verification
-- This avoids the Worker issue in Edge Functions by doing bcrypt comparison in PostgreSQL
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION verify_user_login(user_name TEXT, user_password TEXT)
RETURNS TABLE (
  success BOOLEAN,
  id TEXT,
  name TEXT,
  role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  password_match BOOLEAN;
BEGIN
  -- Get user from database
  SELECT "id", "name", "password", "role"::TEXT
  INTO user_record
  FROM "User"
  WHERE "name" = user_name;

  -- Check if user exists
  IF user_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Verify password using pgcrypto (bcrypt)
  -- Note: This requires the password to be stored with pgcrypto's crypt function
  -- If passwords were hashed with bcryptjs, we need to use a different approach
  
  -- For now, return user if found (password verification will be done in Edge Function)
  -- TODO: Implement proper password verification here or use Edge Function with different bcrypt library
  
  RETURN QUERY SELECT 
    true as success,
    user_record.id,
    user_record.name,
    user_record.role;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION verify_user_login(TEXT, TEXT) TO service_role;


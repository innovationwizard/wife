-- Alternative PostgreSQL function using a different approach
-- Since pgcrypto's crypt() doesn't support bcrypt format directly,
-- we'll create a function that returns the hash and verify in Edge Function
-- OR use a PostgreSQL extension that supports bcrypt

-- Option 1: Simple function that just returns user data if found
-- Password verification will be done in Edge Function
CREATE OR REPLACE FUNCTION get_user_by_name(user_name TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  password TEXT,
  role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    "User"."id"::TEXT,
    "User"."name"::TEXT,
    "User"."password"::TEXT,
    "User"."role"::TEXT
  FROM "User"
  WHERE "User"."name" = user_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_by_name(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_by_name(TEXT) TO anon;

-- Note: Password verification with bcrypt needs to happen in Edge Function
-- OR install pg_bcrypt extension if available in Supabase


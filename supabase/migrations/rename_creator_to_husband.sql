-- ============================================================================
-- Migration: Rename CREATOR role to HUSBAND
-- ============================================================================

BEGIN;

-- Step 1: First, update any existing records that still have 'CREATOR' value
-- We need to do this BEFORE renaming the enum, or use a workaround
-- Since the enum might already be renamed, we'll use a different approach

-- Check if CREATOR still exists in the enum, if not, we need to add it temporarily
DO $$
BEGIN
  -- Try to update records directly using text casting
  -- This works even if the enum value doesn't exist
  UPDATE "User" 
  SET "role" = 'HUSBAND'::"Role"
  WHERE "role"::text = 'CREATOR';
EXCEPTION
  WHEN OTHERS THEN
    -- If that fails, the enum might already be renamed
    -- Try to update using a different method
    RAISE NOTICE 'Could not update CREATOR records, enum may already be renamed';
END $$;

-- Step 2: Rename the enum value (only if it still exists)
DO $$
BEGIN
  -- Check if CREATOR exists in the enum
  IF EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'CREATOR' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) THEN
    ALTER TYPE "Role" RENAME VALUE 'CREATOR' TO 'HUSBAND';
  ELSE
    RAISE NOTICE 'CREATOR enum value does not exist, skipping rename';
  END IF;
END $$;

-- Step 3: Update default value in User table
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'HUSBAND';

COMMIT;


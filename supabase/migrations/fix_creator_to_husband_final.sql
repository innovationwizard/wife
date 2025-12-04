-- ============================================================================
-- Final Migration: Fix CREATOR to HUSBAND
-- ============================================================================
-- This handles the case where enum was renamed but User records still have CREATOR

BEGIN;

-- Step 1: Check what we're dealing with
DO $$
DECLARE
  creator_count INTEGER;
  has_husband BOOLEAN;
  has_creator BOOLEAN;
BEGIN
  -- Count records with CREATOR (as text)
  SELECT COUNT(*) INTO creator_count
  FROM "User"
  WHERE "role"::text = 'CREATOR';
  
  -- Check if HUSBAND exists
  SELECT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'HUSBAND' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) INTO has_husband;
  
  -- Check if CREATOR exists
  SELECT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CREATOR' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE pg_type.typname = 'Role')
  ) INTO has_creator;
  
  RAISE NOTICE 'Records with CREATOR: %, HUSBAND exists: %, CREATOR exists: %', 
    creator_count, has_husband, has_creator;
  
  -- If we have records with CREATOR but enum doesn't have it, we need to fix it
  IF creator_count > 0 THEN
    IF NOT has_creator AND has_husband THEN
      -- Enum was renamed but records weren't updated
      -- We need to add CREATOR back, update records, then remove it
      -- But PostgreSQL doesn't allow this easily...
      -- Instead, we'll use a workaround with ALTER TABLE
      
      -- Create a temporary text column
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role_temp" TEXT;
      
      -- Copy role values as text
      UPDATE "User" SET "role_temp" = "role"::text;
      
      -- Change role column to text temporarily
      ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
      
      -- Update CREATOR to HUSBAND
      UPDATE "User" SET "role" = 'HUSBAND' WHERE "role" = 'CREATOR';
      
      -- Change back to Role enum
      ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
      
      -- Drop temp column
      ALTER TABLE "User" DROP COLUMN IF EXISTS "role_temp";
      
      RAISE NOTICE 'Updated % records from CREATOR to HUSBAND using workaround', creator_count;
    ELSIF has_creator THEN
      -- CREATOR exists, just update records
      UPDATE "User" SET "role" = 'HUSBAND'::"Role" WHERE "role" = 'CREATOR'::"Role";
      RAISE NOTICE 'Updated % records from CREATOR to HUSBAND', creator_count;
    ELSE
      RAISE EXCEPTION 'Cannot update: CREATOR enum does not exist and HUSBAND does not exist';
    END IF;
  END IF;
END $$;

-- Step 2: Rename enum value if CREATOR still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CREATOR' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) THEN
    ALTER TYPE "Role" RENAME VALUE 'CREATOR' TO 'HUSBAND';
    RAISE NOTICE 'Renamed CREATOR enum value to HUSBAND';
  END IF;
END $$;

-- Step 3: Update default
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'HUSBAND';

COMMIT;


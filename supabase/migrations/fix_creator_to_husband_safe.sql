-- ============================================================================
-- Safe Migration: Fix CREATOR to HUSBAND (handles both cases)
-- ============================================================================
-- This migration safely handles the case where:
-- 1. The enum might already be renamed
-- 2. Records might still have 'CREATOR' text value stored
-- 3. The enum value might not exist anymore

BEGIN;

-- Step 1: Check current state and update records using text comparison
-- We'll use a workaround: update records by casting to text first
DO $$
DECLARE
  creator_count INTEGER;
  husband_exists BOOLEAN;
  creator_exists BOOLEAN;
BEGIN
  -- Check if HUSBAND exists in enum
  SELECT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'HUSBAND' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) INTO husband_exists;
  
  -- Check if CREATOR exists in enum
  SELECT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'CREATOR' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) INTO creator_exists;
  
  -- Count records with CREATOR (as text)
  SELECT COUNT(*) INTO creator_count
  FROM "User"
  WHERE "role"::text = 'CREATOR';
  
  RAISE NOTICE 'HUSBAND exists: %, CREATOR exists: %, Records with CREATOR: %', 
    husband_exists, creator_exists, creator_count;
  
  -- If we have records with CREATOR and HUSBAND exists, update them
  IF creator_count > 0 AND husband_exists THEN
    -- Use a workaround: update via a temporary column or direct cast
    -- Since we can't directly update with a non-existent enum value,
    -- we need to add CREATOR back first, update, then remove it
    
    -- Add CREATOR back if it doesn't exist
    IF NOT creator_exists THEN
      ALTER TYPE "Role" ADD VALUE 'CREATOR';
      RAISE NOTICE 'Added CREATOR enum value temporarily';
    END IF;
    
    -- Now update the records
    UPDATE "User" 
    SET "role" = 'HUSBAND'::"Role"
    WHERE "role"::text = 'CREATOR';
    
    RAISE NOTICE 'Updated % records from CREATOR to HUSBAND', creator_count;
    
    -- Remove CREATOR from enum by renaming it (if it still exists)
    IF creator_exists OR (SELECT COUNT(*) FROM pg_enum WHERE enumlabel = 'CREATOR' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')) > 0 THEN
      -- Check if there are any records still using CREATOR
      SELECT COUNT(*) INTO creator_count
      FROM "User"
      WHERE "role"::text = 'CREATOR';
      
      IF creator_count = 0 THEN
        -- All records updated, safe to rename
        ALTER TYPE "Role" RENAME VALUE 'CREATOR' TO 'HUSBAND';
        RAISE NOTICE 'Renamed CREATOR enum value to HUSBAND';
      END IF;
    END IF;
  ELSIF creator_count > 0 AND NOT husband_exists THEN
    -- HUSBAND doesn't exist, need to create it first
    RAISE EXCEPTION 'HUSBAND enum value does not exist. Please run the enum rename migration first.';
  ELSE
    RAISE NOTICE 'No records with CREATOR found, or enum already correct';
  END IF;
END $$;

-- Step 2: Update default value
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'HUSBAND';

COMMIT;


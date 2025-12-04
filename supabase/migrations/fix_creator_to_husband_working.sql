-- ============================================================================
-- Working Migration: Fix CREATOR to HUSBAND
-- ============================================================================
-- This handles all scenarios and works around PostgreSQL's enum transaction limitation

-- Step 1: Add HUSBAND to enum if it doesn't exist (must be in separate transaction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'HUSBAND' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'HUSBAND';
    RAISE NOTICE 'Added HUSBAND to enum';
  END IF;
END $$;

-- Commit the enum addition (PostgreSQL requires this)
COMMIT;

-- Start new transaction for updates
BEGIN;

-- Step 2: Update records using TEXT workaround (safest approach)
DO $$
DECLARE
  creator_count INTEGER;
BEGIN
  -- Count records with CREATOR
  SELECT COUNT(*) INTO creator_count
  FROM "User"
  WHERE "role"::text = 'CREATOR';
  
  RAISE NOTICE 'Found % records with CREATOR', creator_count;
  
  IF creator_count > 0 THEN
    -- Use TEXT workaround to avoid enum transaction issues
    -- Create temporary text column
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role_temp" TEXT;
    
    -- Copy current role values as text
    UPDATE "User" SET "role_temp" = "role"::text;
    
    -- Convert role column to TEXT temporarily
    ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
    
    -- Update CREATOR to HUSBAND as text
    UPDATE "User" SET "role" = 'HUSBAND' WHERE "role" = 'CREATOR';
    
    -- Convert back to Role enum
    ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
    
    -- Drop temp column
    ALTER TABLE "User" DROP COLUMN IF EXISTS "role_temp";
    
    RAISE NOTICE 'Updated % records from CREATOR to HUSBAND', creator_count;
  ELSE
    RAISE NOTICE 'No records with CREATOR found';
  END IF;
END $$;

-- Step 3: Rename CREATOR to HUSBAND in enum if CREATOR still exists
DO $$
DECLARE
  creator_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'CREATOR' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) THEN
    -- Check if any records still use CREATOR
    SELECT COUNT(*) INTO creator_count
    FROM "User"
    WHERE "role"::text = 'CREATOR';
    
    IF creator_count = 0 THEN
      -- Safe to rename
      ALTER TYPE "Role" RENAME VALUE 'CREATOR' TO 'HUSBAND';
      RAISE NOTICE 'Renamed CREATOR enum value to HUSBAND';
    ELSE
      RAISE NOTICE 'Cannot rename: % records still have CREATOR (this should not happen)', creator_count;
    END IF;
  END IF;
END $$;

-- Step 4: Update default value
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'HUSBAND';

COMMIT;

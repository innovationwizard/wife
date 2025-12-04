-- Fix Role enum to match Prisma schema
-- Run this in Supabase SQL Editor

-- Legacy cleanup: If STAKEHOLDER exists (from old schema), rename it to WIFE
-- This is a one-time migration for databases that had the old STAKEHOLDER enum value
DO $$
BEGIN
  -- Check if STAKEHOLDER value exists (legacy)
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'STAKEHOLDER' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) THEN
    -- Rename legacy STAKEHOLDER to WIFE
    ALTER TYPE "Role" RENAME VALUE 'STAKEHOLDER' TO 'WIFE';
  END IF;
  
  -- Ensure WIFE exists (add if it doesn't)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'WIFE' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'WIFE';
  END IF;
END $$;


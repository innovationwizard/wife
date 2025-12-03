-- Rename COMPENDIUM to ARCHIVE in ItemStatus enum
-- Run this in Supabase SQL Editor

BEGIN;

-- Step 1: Create new enum with ARCHIVE (replacing COMPENDIUM)
CREATE TYPE "ItemStatus_new" AS ENUM (
  'INBOX',
  'BACKLOG',
  'TODO',
  'DOING',
  'IN_REVIEW',
  'BLOCKED',
  'DONE',
  'ARCHIVE',        -- COMPENDIUM renamed to ARCHIVE
  'ON_HOLD',
  'COLD_STORAGE'
);

-- Step 2: Convert Item.status column to use the new enum
ALTER TABLE "Item" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Item" ALTER COLUMN status TYPE "ItemStatus_new" USING 
  CASE 
    WHEN status::text = 'COMPENDIUM' THEN 'ARCHIVE'::"ItemStatus_new"
    ELSE status::text::"ItemStatus_new"
  END;
ALTER TABLE "Item" ALTER COLUMN status SET DEFAULT 'INBOX'::"ItemStatus_new";

-- Step 3: Convert StatusChange.fromStatus column
ALTER TABLE "StatusChange" ALTER COLUMN "fromStatus" TYPE "ItemStatus_new" USING 
  CASE 
    WHEN "fromStatus"::text = 'COMPENDIUM' THEN 'ARCHIVE'::"ItemStatus_new"
    WHEN "fromStatus" IS NULL THEN NULL
    ELSE "fromStatus"::text::"ItemStatus_new"
  END;

-- Step 4: Convert StatusChange.toStatus column
ALTER TABLE "StatusChange" ALTER COLUMN "toStatus" TYPE "ItemStatus_new" USING 
  CASE 
    WHEN "toStatus"::text = 'COMPENDIUM' THEN 'ARCHIVE'::"ItemStatus_new"
    ELSE "toStatus"::text::"ItemStatus_new"
  END;

-- Step 5: Drop the old enum and rename the new one
DROP TYPE IF EXISTS "ItemStatus";
ALTER TYPE "ItemStatus_new" RENAME TO "ItemStatus";

COMMIT;

-- Verification query (run separately to verify):
-- SELECT unnest(enum_range(NULL::"ItemStatus")) AS status;


-- Remove ON_HOLD and COLD_STORAGE from ItemStatus enum
-- Run this in Supabase SQL Editor
-- Any items with these statuses will be converted to ARCHIVE

BEGIN;

-- Step 1: Check for items with ON_HOLD or COLD_STORAGE status
-- (We'll convert them to ARCHIVE before removing the enum values)

-- Convert ON_HOLD items to ARCHIVE
UPDATE "Item" 
SET status = 'ARCHIVE'::"ItemStatus"
WHERE status::text = 'ON_HOLD';

-- Convert COLD_STORAGE items to ARCHIVE
UPDATE "Item" 
SET status = 'ARCHIVE'::"ItemStatus"
WHERE status::text = 'COLD_STORAGE';

-- Update StatusChange records
UPDATE "StatusChange"
SET "fromStatus" = 'ARCHIVE'::"ItemStatus"
WHERE "fromStatus"::text = 'ON_HOLD' OR "fromStatus"::text = 'COLD_STORAGE';

UPDATE "StatusChange"
SET "toStatus" = 'ARCHIVE'::"ItemStatus"
WHERE "toStatus"::text = 'ON_HOLD' OR "toStatus"::text = 'COLD_STORAGE';

-- Step 2: Create new enum without ON_HOLD and COLD_STORAGE
CREATE TYPE "ItemStatus_new" AS ENUM (
  'INBOX',
  'BACKLOG',
  'TODO',
  'DOING',
  'IN_REVIEW',
  'BLOCKED',
  'DONE',
  'ARCHIVE'
);

-- Step 3: Convert Item.status column to use the new enum
ALTER TABLE "Item" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Item" ALTER COLUMN status TYPE "ItemStatus_new" USING 
  CASE 
    WHEN status::text IN ('ON_HOLD', 'COLD_STORAGE') THEN 'ARCHIVE'::"ItemStatus_new"
    ELSE status::text::"ItemStatus_new"
  END;
ALTER TABLE "Item" ALTER COLUMN status SET DEFAULT 'INBOX'::"ItemStatus_new";

-- Step 4: Convert StatusChange.fromStatus column
ALTER TABLE "StatusChange" ALTER COLUMN "fromStatus" TYPE "ItemStatus_new" USING 
  CASE 
    WHEN "fromStatus"::text IN ('ON_HOLD', 'COLD_STORAGE') THEN 'ARCHIVE'::"ItemStatus_new"
    WHEN "fromStatus" IS NULL THEN NULL
    ELSE "fromStatus"::text::"ItemStatus_new"
  END;

-- Step 5: Convert StatusChange.toStatus column
ALTER TABLE "StatusChange" ALTER COLUMN "toStatus" TYPE "ItemStatus_new" USING 
  CASE 
    WHEN "toStatus"::text IN ('ON_HOLD', 'COLD_STORAGE') THEN 'ARCHIVE'::"ItemStatus_new"
    ELSE "toStatus"::text::"ItemStatus_new"
  END;

-- Step 6: Drop the old enum and rename the new one
DROP TYPE IF EXISTS "ItemStatus";
ALTER TYPE "ItemStatus_new" RENAME TO "ItemStatus";

COMMIT;

-- Verification query (run separately to verify):
-- SELECT unnest(enum_range(NULL::"ItemStatus")) AS status;
-- SELECT COUNT(*) as on_hold_count FROM "Item" WHERE status::text = 'ON_HOLD';
-- SELECT COUNT(*) as cold_storage_count FROM "Item" WHERE status::text = 'COLD_STORAGE';


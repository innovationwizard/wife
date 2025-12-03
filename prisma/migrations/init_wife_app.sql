-- ============================================================================
-- Initial Migration for Wife App
-- Fresh database setup - run this in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- Enums
-- ============================================================================

CREATE TYPE "Role" AS ENUM ('CREATOR', 'STAKEHOLDER');
CREATE TYPE "ItemType" AS ENUM ('TASK', 'INFO');
CREATE TYPE "ItemStatus" AS ENUM (
  'INBOX',
  'BACKLOG',
  'TODO',
  'DOING',
  'IN_REVIEW',
  'BLOCKED',
  'DONE',
  'ARCHIVE'
);
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "Swimlane" AS ENUM ('EXPEDITE', 'PROJECT', 'HABIT', 'HOME');
CREATE TYPE "Severity" AS ENUM ('ERROR', 'WARNING', 'INFO', 'SUCCESS');

-- ============================================================================
-- Tables
-- ============================================================================

-- User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CREATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- Item table
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "humanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rawInstructions" TEXT NOT NULL,
    "notes" TEXT,
    "type" "ItemType" NOT NULL DEFAULT 'TASK',
    "status" "ItemStatus" NOT NULL DEFAULT 'INBOX',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "swimlane" "Swimlane" NOT NULL DEFAULT 'PROJECT',
    "labels" TEXT[],
    "createdByUserId" TEXT NOT NULL,
    "capturedByUserId" TEXT,
    "routingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastProgressAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "blockedAt" TIMESTAMP(3),
    "totalTimeInCreate" INTEGER DEFAULT 0,
    "cycleCount" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Item_humanId_key" ON "Item"("humanId");
CREATE INDEX "Item_status_statusChangedAt_idx" ON "Item"("status", "statusChangedAt");
CREATE INDEX "Item_createdByUserId_createdAt_idx" ON "Item"("createdByUserId", "createdAt");
CREATE INDEX "Item_swimlane_priority_idx" ON "Item"("swimlane", "priority");
CREATE INDEX "Item_capturedByUserId_createdAt_idx" ON "Item"("capturedByUserId", "createdAt");
CREATE INDEX "Item_status_swimlane_order_idx" ON "Item"("status", "swimlane", "order");

-- StatusChange table
CREATE TABLE "StatusChange" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fromStatus" "ItemStatus",
    "toStatus" "ItemStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" TEXT,
    "reason" TEXT,
    "duration" INTEGER,

    CONSTRAINT "StatusChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StatusChange_itemId_changedAt_idx" ON "StatusChange"("itemId", "changedAt");

-- Rule table
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleValue" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Rule_ruleKey_key" ON "Rule"("ruleKey");

-- SystemMessage table
CREATE TABLE "SystemMessage" (
    "id" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMessage_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- Foreign Keys
-- ============================================================================

ALTER TABLE "Item" ADD CONSTRAINT "Item_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_capturedByUserId_fkey" FOREIGN KEY ("capturedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StatusChange" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemMessage" ENABLE ROW LEVEL SECURITY;

-- Policies: Allow service_role full access (used by Prisma)
CREATE POLICY "user_service_role_all" ON "User"
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "item_service_role_all" ON "Item"
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "statuschange_service_role_all" ON "StatusChange"
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "rule_service_role_all" ON "Rule"
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "systemmessage_service_role_all" ON "SystemMessage"
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policies: Deny anon and authenticated roles (prevent PostgREST access)
CREATE POLICY "user_deny_anon_auth" ON "User"
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY "item_deny_anon_auth" ON "Item"
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY "statuschange_deny_anon_auth" ON "StatusChange"
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY "rule_deny_anon_auth" ON "Rule"
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY "systemmessage_deny_anon_auth" ON "SystemMessage"
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

COMMIT;

-- ============================================================================
-- Verification Queries (optional - run these to verify)
-- ============================================================================

-- Check all tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Check ItemStatus enum values
-- SELECT unnest(enum_range(NULL::"ItemStatus")) AS status;

-- Check that notes column exists
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'Item' AND column_name = 'notes';


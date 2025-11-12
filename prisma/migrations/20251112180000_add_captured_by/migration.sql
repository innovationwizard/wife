-- AlterTable
ALTER TABLE "Item"
ADD COLUMN "capturedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Item_capturedByUserId_createdAt_idx" ON "Item"("capturedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Item"
ADD CONSTRAINT "Item_capturedByUserId_fkey" FOREIGN KEY ("capturedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


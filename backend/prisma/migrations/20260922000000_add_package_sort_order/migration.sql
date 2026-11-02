-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "packages_isFeatured_sortOrder_idx" ON "packages"("isFeatured", "sortOrder");

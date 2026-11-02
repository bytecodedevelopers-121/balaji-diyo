-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "packages" ADD COLUMN     "popularSortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "packages_isPopular_popularSortOrder_idx" ON "packages"("isPopular", "popularSortOrder");

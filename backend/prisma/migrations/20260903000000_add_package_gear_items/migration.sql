-- AlterTable
ALTER TABLE "packages" ADD COLUMN "packingListIntro" TEXT;

-- CreateTable
CREATE TABLE "package_gear_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_gear_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "package_gear_items" ADD CONSTRAINT "package_gear_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

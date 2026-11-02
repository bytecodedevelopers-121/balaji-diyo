-- AlterTable
ALTER TABLE "places" ADD COLUMN     "attractionOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "placeTypeId" TEXT;

-- CreateTable
CREATE TABLE "place_regions" (
    "placeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "place_regions_pkey" PRIMARY KEY ("placeId","categoryId")
);

-- CreateTable
CREATE TABLE "place_facts" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_facts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "place_regions_categoryId_sortOrder_idx" ON "place_regions"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "place_facts_placeId_sortOrder_idx" ON "place_facts"("placeId", "sortOrder");

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_placeTypeId_fkey" FOREIGN KEY ("placeTypeId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_regions" ADD CONSTRAINT "place_regions_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_regions" ADD CONSTRAINT "place_regions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_facts" ADD CONSTRAINT "place_facts_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;


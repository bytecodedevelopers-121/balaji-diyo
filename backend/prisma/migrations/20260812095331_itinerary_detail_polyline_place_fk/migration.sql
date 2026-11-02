-- AlterTable
ALTER TABLE "itinerary_details" ADD COLUMN     "destinationPlaceId" TEXT,
ADD COLUMN     "encodedPolyline" TEXT,
ADD COLUMN     "footnote" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "originPlaceId" TEXT;

-- AddForeignKey
ALTER TABLE "itinerary_details" ADD CONSTRAINT "itinerary_details_originPlaceId_fkey" FOREIGN KEY ("originPlaceId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_details" ADD CONSTRAINT "itinerary_details_destinationPlaceId_fkey" FOREIGN KEY ("destinationPlaceId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

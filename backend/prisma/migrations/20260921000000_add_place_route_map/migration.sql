-- AlterTable
ALTER TABLE "places" ADD COLUMN "routeMapId" TEXT;

-- CreateIndex
CREATE INDEX "places_routeMapId_idx" ON "places"("routeMapId");

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_routeMapId_fkey" FOREIGN KEY ("routeMapId") REFERENCES "package_maps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "package_maps" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "mapTitle" TEXT NOT NULL,
    "mapAbstract" TEXT,
    "mapDetails" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "package_maps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "package_maps" ADD CONSTRAINT "package_maps_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

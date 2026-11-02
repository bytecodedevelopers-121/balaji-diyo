-- CreateTable
CREATE TABLE "gallery_albums" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "destinationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "gallery_albums_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gallery_albums_destinationId_displayOrder_idx" ON "gallery_albums"("destinationId", "displayOrder");

-- AddForeignKey
ALTER TABLE "gallery_albums" ADD CONSTRAINT "gallery_albums_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

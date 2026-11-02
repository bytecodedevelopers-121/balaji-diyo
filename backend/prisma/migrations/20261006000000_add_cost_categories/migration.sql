-- CreateTable
CREATE TABLE "cost_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CostDetailType" NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cost_categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "package_cost_details" ADD COLUMN "costCategoryId" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "package_cost_details" ADD CONSTRAINT "package_cost_details_costCategoryId_fkey" FOREIGN KEY ("costCategoryId") REFERENCES "cost_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

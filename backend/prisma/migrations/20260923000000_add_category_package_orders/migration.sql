-- CreateTable
CREATE TABLE "category_package_orders" (
    "categoryId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "category_package_orders_pkey" PRIMARY KEY ("categoryId","packageId")
);

-- AddForeignKey
ALTER TABLE "category_package_orders" ADD CONSTRAINT "category_package_orders_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_package_orders" ADD CONSTRAINT "category_package_orders_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

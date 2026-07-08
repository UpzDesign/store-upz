/*
  Warnings:

  - A unique constraint covering the columns `[packageId,catalogItemId]` on the table `PackageItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "PackageItem" DROP CONSTRAINT "PackageItem_productId_fkey";

-- AlterTable
ALTER TABLE "PackageItem" ADD COLUMN     "catalogItemId" INTEGER,
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "collectionId" INTEGER,
    "productId" INTEGER,
    "itemType" TEXT NOT NULL DEFAULT 'product',
    "sourceVendor" TEXT,
    "sourceProductId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "price" DOUBLE PRECISION,
    "sku" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_productId_key" ON "CatalogItem"("productId");

-- CreateIndex
CREATE INDEX "CatalogItem_companyId_itemType_idx" ON "CatalogItem"("companyId", "itemType");

-- CreateIndex
CREATE INDEX "CatalogItem_companyId_collectionId_idx" ON "CatalogItem"("companyId", "collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_companyId_sourceVendor_sourceProductId_key" ON "CatalogItem"("companyId", "sourceVendor", "sourceProductId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageItem_packageId_catalogItemId_key" ON "PackageItem"("packageId", "catalogItemId");

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

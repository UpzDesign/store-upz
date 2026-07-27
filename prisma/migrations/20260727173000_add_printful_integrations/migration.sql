CREATE TABLE "PrintfulIntegration" (
  "id" SERIAL NOT NULL,
  "companyId" INTEGER NOT NULL,
  "encryptedAccessToken" TEXT NOT NULL,
  "storeId" TEXT,
  "storeName" TEXT,
  "storeType" TEXT,
  "status" TEXT NOT NULL DEFAULT 'connected',
  "lastTestedAt" TIMESTAMP(3),
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PrintfulIntegration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrintfulIntegration_companyId_key" ON "PrintfulIntegration"("companyId");

ALTER TABLE "PrintfulIntegration"
ADD CONSTRAINT "PrintfulIntegration_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

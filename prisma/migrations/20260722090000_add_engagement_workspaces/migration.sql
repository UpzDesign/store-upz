-- CreateTable
CREATE TABLE "Engagement" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'property',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "budget" DOUBLE PRECISION,
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementAsset" (
    "id" SERIAL NOT NULL,
    "engagementId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementAsset_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "engagementId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Engagement_companyId_slug_key" ON "Engagement"("companyId", "slug");
CREATE INDEX "Engagement_companyId_status_idx" ON "Engagement"("companyId", "status");
CREATE INDEX "Engagement_companyId_address_idx" ON "Engagement"("companyId", "address");
CREATE INDEX "EngagementAsset_engagementId_category_idx" ON "EngagementAsset"("engagementId", "category");
CREATE INDEX "Project_engagementId_status_idx" ON "Project"("engagementId", "status");

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngagementAsset" ADD CONSTRAINT "EngagementAsset_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill one engagement per existing work order so no project is orphaned.
INSERT INTO "Engagement" ("companyId", "name", "slug", "type", "description", "status", "clientVisible", "createdAt", "updatedAt")
SELECT
  p."companyId",
  p."title",
  'legacy-' || p."id",
  'campaign',
  p."description",
  CASE WHEN p."status" = 'cancelled' THEN 'archived' ELSE 'active' END,
  p."clientVisible",
  p."createdAt",
  p."updatedAt"
FROM "Project" p
WHERE p."engagementId" IS NULL;

UPDATE "Project" p
SET "engagementId" = e."id"
FROM "Engagement" e
WHERE e."companyId" = p."companyId"
  AND e."slug" = 'legacy-' || p."id"
  AND p."engagementId" IS NULL;

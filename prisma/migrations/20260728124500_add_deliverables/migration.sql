CREATE TABLE "Deliverable" (
  "id" SERIAL NOT NULL,
  "projectId" INTEGER NOT NULL,
  "stageId" INTEGER,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'general',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "clientVisible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliverableVersion" (
  "id" SERIAL NOT NULL,
  "deliverableId" INTEGER NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "label" TEXT,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT,
  "fileType" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'waiting_for_review',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliverableVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliverableReview" (
  "id" SERIAL NOT NULL,
  "versionId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "message" TEXT,
  "author" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliverableReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Deliverable_projectId_status_idx" ON "Deliverable"("projectId", "status");
CREATE INDEX "Deliverable_stageId_idx" ON "Deliverable"("stageId");
CREATE UNIQUE INDEX "DeliverableVersion_deliverableId_versionNumber_key" ON "DeliverableVersion"("deliverableId", "versionNumber");
CREATE INDEX "DeliverableVersion_deliverableId_createdAt_idx" ON "DeliverableVersion"("deliverableId", "createdAt");
CREATE INDEX "DeliverableReview_versionId_createdAt_idx" ON "DeliverableReview"("versionId", "createdAt");

ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProjectTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliverableVersion" ADD CONSTRAINT "DeliverableVersion_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliverableReview" ADD CONSTRAINT "DeliverableReview_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DeliverableVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
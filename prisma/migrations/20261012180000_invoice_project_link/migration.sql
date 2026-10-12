ALTER TABLE "StandaloneInvoice" ADD COLUMN "projectId" INTEGER;
CREATE INDEX "StandaloneInvoice_projectId_idx" ON "StandaloneInvoice"("projectId");

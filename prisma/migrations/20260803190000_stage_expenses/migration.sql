CREATE TABLE "StageExpense" (
  "id" SERIAL NOT NULL,
  "taskId" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Other',
  "vendor" TEXT,
  "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "actualCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "expenseDate" TIMESTAMP(3),
  "receiptUrl" TEXT,
  "note" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StageExpense_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StageExpense_taskId_expenseDate_idx" ON "StageExpense"("taskId", "expenseDate");
ALTER TABLE "StageExpense" ADD CONSTRAINT "StageExpense_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ProjectTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
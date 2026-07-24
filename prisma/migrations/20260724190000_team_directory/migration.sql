CREATE TABLE "TeamMember" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "role" TEXT NOT NULL DEFAULT 'Creative Operations',
  "capacity" INTEGER NOT NULL DEFAULT 5,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamMember_name_key" ON "TeamMember"("name");
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");
CREATE INDEX "TeamMember_active_name_idx" ON "TeamMember"("active", "name");

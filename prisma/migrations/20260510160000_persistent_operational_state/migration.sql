-- AlterEnum
ALTER TYPE "FinancialEventType" ADD VALUE 'OPERATIONAL_ATTENTION_AUTO_RESOLVED';

-- CreateTable
CREATE TABLE "UserOperationalCheckpoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOperationalCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOperationalCheckpoint_userId_key" ON "UserOperationalCheckpoint"("userId");

-- CreateIndex
CREATE INDEX "UserOperationalCheckpoint_userId_idx" ON "UserOperationalCheckpoint"("userId");

-- AddForeignKey
ALTER TABLE "UserOperationalCheckpoint" ADD CONSTRAINT "UserOperationalCheckpoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

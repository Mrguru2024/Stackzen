-- CreateEnum
CREATE TYPE "IncomeProfileType" AS ENUM (
  'PAYCHECK',
  'CONTRACTOR',
  'FREELANCE',
  'GIG',
  'SIDE_HUSTLE',
  'BUSINESS',
  'COMMISSION',
  'PASSIVE',
  'OTHER'
);

-- CreateTable
CREATE TABLE "UserIncomeProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "IncomeProfileType" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserIncomeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserIncomeProfile_userId_type_key" ON "UserIncomeProfile"("userId", "type");
CREATE INDEX "UserIncomeProfile_userId_idx" ON "UserIncomeProfile"("userId");
CREATE INDEX "UserIncomeProfile_type_idx" ON "UserIncomeProfile"("type");
CREATE INDEX "UserIncomeProfile_userId_isActive_idx" ON "UserIncomeProfile"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "UserIncomeProfile"
ADD CONSTRAINT "UserIncomeProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;


/*
  Warnings:

  - The `duration` column on the `Service` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionLevel" ADD VALUE 'ZEN_PLUS';
ALTER TYPE "SubscriptionLevel" ADD VALUE 'COACHING_SESSION';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "time" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "jobTag" TEXT;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER,
ALTER COLUMN "rating" DROP NOT NULL,
ALTER COLUMN "reviews" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTrialActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "trialExpiresAt" TIMESTAMP(3),
ADD COLUMN     "trialStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WellnessScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryScores" JSONB NOT NULL,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WellnessScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UserOnboardingData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER,
    "occupation" TEXT,
    "education" TEXT,
    "maritalStatus" TEXT,
    "dependents" INTEGER,
    "location" TEXT,
    "primaryIncome" DOUBLE PRECISION,
    "secondaryIncome" DOUBLE PRECISION,
    "incomeFrequency" TEXT,
    "incomeSources" JSONB,
    "totalDebt" DOUBLE PRECISION,
    "mortgageAmount" DOUBLE PRECISION,
    "carLoanAmount" DOUBLE PRECISION,
    "studentLoanAmount" DOUBLE PRECISION,
    "creditCardDebt" DOUBLE PRECISION,
    "otherDebt" DOUBLE PRECISION,
    "emergencyFund" DOUBLE PRECISION,
    "retirementSavings" DOUBLE PRECISION,
    "investmentAccounts" DOUBLE PRECISION,
    "otherAssets" DOUBLE PRECISION,
    "shortTermGoals" JSONB,
    "longTermGoals" JSONB,
    "goalTimeframes" JSONB,
    "riskTolerance" TEXT,
    "investmentExperience" TEXT,
    "preferredInvestments" JSONB,
    "monthlyExpenses" DOUBLE PRECISION,
    "discretionarySpending" DOUBLE PRECISION,
    "savingRate" DOUBLE PRECISION,
    "financialLiteracy" TEXT,
    "areasOfInterest" JSONB,
    "aiCommunicationStyle" TEXT,
    "preferredAdviceType" TEXT,
    "notificationPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOnboardingData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WellnessScore_userId_idx" ON "WellnessScore"("userId");

-- CreateIndex
CREATE INDEX "WellnessScore_timestamp_idx" ON "WellnessScore"("timestamp");

-- CreateIndex
CREATE INDEX "WellnessScore_createdAt_idx" ON "WellnessScore"("createdAt");

-- CreateIndex
CREATE INDEX "FinancialGoal_userId_idx" ON "FinancialGoal"("userId");

-- CreateIndex
CREATE INDEX "FinancialGoal_category_idx" ON "FinancialGoal"("category");

-- CreateIndex
CREATE INDEX "FinancialGoal_status_idx" ON "FinancialGoal"("status");

-- CreateIndex
CREATE INDEX "FinancialGoal_createdAt_idx" ON "FinancialGoal"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_token_idx" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_expires_idx" ON "VerificationToken"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UserOnboardingData_userId_key" ON "UserOnboardingData"("userId");

-- CreateIndex
CREATE INDEX "UserOnboardingData_userId_idx" ON "UserOnboardingData"("userId");

-- CreateIndex
CREATE INDEX "UserOnboardingData_createdAt_idx" ON "UserOnboardingData"("createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Account_provider_idx" ON "Account"("provider");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_date_idx" ON "Booking"("date");

-- CreateIndex
CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");

-- CreateIndex
CREATE INDEX "Booking_userId_status_date_idx" ON "Booking"("userId", "status", "date");

-- CreateIndex
CREATE INDEX "Booking_userId_date_idx" ON "Booking"("userId", "date");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_serviceId_status_idx" ON "Booking"("serviceId", "status");

-- CreateIndex
CREATE INDEX "BudgetAllocation_userId_idx" ON "BudgetAllocation"("userId");

-- CreateIndex
CREATE INDEX "BudgetAllocation_category_idx" ON "BudgetAllocation"("category");

-- CreateIndex
CREATE INDEX "BudgetAllocation_period_idx" ON "BudgetAllocation"("period");

-- CreateIndex
CREATE INDEX "BudgetAllocation_userId_period_idx" ON "BudgetAllocation"("userId", "period");

-- CreateIndex
CREATE INDEX "BudgetAllocation_createdAt_idx" ON "BudgetAllocation"("createdAt");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE INDEX "Deployment_userId_idx" ON "Deployment"("userId");

-- CreateIndex
CREATE INDEX "Deployment_status_idx" ON "Deployment"("status");

-- CreateIndex
CREATE INDEX "Deployment_createdAt_idx" ON "Deployment"("createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_userId_idx" ON "ErrorLog"("userId");

-- CreateIndex
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_userId_category_idx" ON "Expense"("userId", "category");

-- CreateIndex
CREATE INDEX "Expense_userId_date_idx" ON "Expense"("userId", "date");

-- CreateIndex
CREATE INDEX "Expense_userId_category_date_idx" ON "Expense"("userId", "category", "date");

-- CreateIndex
CREATE INDEX "Expense_createdAt_idx" ON "Expense"("createdAt");

-- CreateIndex
CREATE INDEX "Expense_amount_idx" ON "Expense"("amount");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "GigApplication_userId_idx" ON "GigApplication"("userId");

-- CreateIndex
CREATE INDEX "GigApplication_status_idx" ON "GigApplication"("status");

-- CreateIndex
CREATE INDEX "GigApplication_createdAt_idx" ON "GigApplication"("createdAt");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_userId_status_idx" ON "Invoice"("userId", "status");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "Service_userId_idx" ON "Service"("userId");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE INDEX "Service_price_idx" ON "Service"("price");

-- CreateIndex
CREATE INDEX "Service_isProOnly_idx" ON "Service"("isProOnly");

-- CreateIndex
CREATE INDEX "Service_createdAt_idx" ON "Service"("createdAt");

-- CreateIndex
CREATE INDEX "Service_userId_category_idx" ON "Service"("userId", "category");

-- CreateIndex
CREATE INDEX "Service_userId_isProOnly_idx" ON "Service"("userId", "isProOnly");

-- CreateIndex
CREATE INDEX "Service_userId_price_idx" ON "Service"("userId", "price");

-- CreateIndex
CREATE INDEX "Service_category_price_idx" ON "Service"("category", "price");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "User_subscriptionLevel_idx" ON "User"("subscriptionLevel");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_trialExpiresAt_idx" ON "User"("trialExpiresAt");

-- CreateIndex
CREATE INDEX "User_isTrialActive_idx" ON "User"("isTrialActive");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WellnessScore" ADD CONSTRAINT "WellnessScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnboardingData" ADD CONSTRAINT "UserOnboardingData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

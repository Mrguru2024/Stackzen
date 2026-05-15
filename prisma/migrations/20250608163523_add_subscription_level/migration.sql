/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `favoriteGigIds` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hashedPassword` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeAccountId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeEnabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AiUsageLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BankConnection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Challenge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeletionReminder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Expense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FinancialGoal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Goal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Income` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LineItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PerformanceLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Quote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavingsGoal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SpendingGuardrail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WellnessScore` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SubscriptionLevel" AS ENUM ('FREE', 'PRO', 'LIFETIME');

-- DropForeignKey
ALTER TABLE "AiUsageLog" DROP CONSTRAINT "AiUsageLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "BankConnection" DROP CONSTRAINT "BankConnection_userId_fkey";

-- DropForeignKey
ALTER TABLE "Challenge" DROP CONSTRAINT "Challenge_userId_fkey";

-- DropForeignKey
ALTER TABLE "DeletionReminder" DROP CONSTRAINT "DeletionReminder_userId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_userId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialGoal" DROP CONSTRAINT "FinancialGoal_userId_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_userId_fkey";

-- DropForeignKey
ALTER TABLE "Income" DROP CONSTRAINT "Income_userId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_userId_fkey";

-- DropForeignKey
ALTER TABLE "LineItem" DROP CONSTRAINT "LineItem_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_contractorLocationId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_serviceLocationId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_userId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavingsGoal" DROP CONSTRAINT "SavingsGoal_userId_fkey";

-- DropForeignKey
ALTER TABLE "Settings" DROP CONSTRAINT "Settings_userId_fkey";

-- DropForeignKey
ALTER TABLE "SpendingGuardrail" DROP CONSTRAINT "SpendingGuardrail_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_userId_fkey";

-- DropForeignKey
ALTER TABLE "WellnessScore" DROP CONSTRAINT "WellnessScore_userId_fkey";

-- DropIndex
DROP INDEX "User_stripeAccountId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "favoriteGigIds",
DROP COLUMN "hashedPassword",
DROP COLUMN "password",
DROP COLUMN "role",
DROP COLUMN "stripeAccountId",
DROP COLUMN "stripeEnabled",
DROP COLUMN "updatedAt",
ADD COLUMN     "subscriptionLevel" "SubscriptionLevel" NOT NULL DEFAULT 'FREE';

-- DropTable
DROP TABLE "AiUsageLog";

-- DropTable
DROP TABLE "BankConnection";

-- DropTable
DROP TABLE "Challenge";

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "DeletionReminder";

-- DropTable
DROP TABLE "Expense";

-- DropTable
DROP TABLE "FinancialGoal";

-- DropTable
DROP TABLE "Goal";

-- DropTable
DROP TABLE "Income";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "LineItem";

-- DropTable
DROP TABLE "Location";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "PasswordResetToken";

-- DropTable
DROP TABLE "PerformanceLog";

-- DropTable
DROP TABLE "Quote";

-- DropTable
DROP TABLE "Report";

-- DropTable
DROP TABLE "SavingsGoal";

-- DropTable
DROP TABLE "Settings";

-- DropTable
DROP TABLE "SpendingGuardrail";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "UserSettings";

-- DropTable
DROP TABLE "VerificationToken";

-- DropTable
DROP TABLE "WellnessScore";

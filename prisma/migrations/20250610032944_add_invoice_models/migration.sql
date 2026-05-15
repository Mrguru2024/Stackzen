/*
  Warnings:

  - You are about to drop the column `needs` on the `BudgetAllocation` table. All the data in the column will be lost.
  - You are about to drop the column `savings` on the `BudgetAllocation` table. All the data in the column will be lost.
  - You are about to drop the column `wants` on the `BudgetAllocation` table. All the data in the column will be lost.
  - You are about to drop the column `mentorId` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Deployment` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `ErrorLog` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `ErrorLog` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `ErrorLog` table. All the data in the column will be lost.
  - You are about to drop the column `deviceInfo` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `featuresUsed` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `performance` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `suggestions` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `timeSpent` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the `Mentor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MentorAvailability` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MentorRating` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stackzengig` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `BudgetAllocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `BudgetAllocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `BudgetAllocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ErrorLog` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `ErrorLog` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `content` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BudgetAllocation" DROP CONSTRAINT "BudgetAllocation_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "Deployment" DROP CONSTRAINT "Deployment_userId_fkey";

-- DropForeignKey
ALTER TABLE "ErrorLog" DROP CONSTRAINT "ErrorLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "GigApplication" DROP CONSTRAINT "GigApplication_gigId_fkey";

-- DropForeignKey
ALTER TABLE "GigApplication" DROP CONSTRAINT "GigApplication_userId_fkey";

-- DropForeignKey
ALTER TABLE "MentorAvailability" DROP CONSTRAINT "MentorAvailability_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "MentorRating" DROP CONSTRAINT "MentorRating_mentorId_fkey";

-- DropIndex
DROP INDEX "BudgetAllocation_userId_idx";

-- DropIndex
DROP INDEX "ChatMessage_mentorId_idx";

-- DropIndex
DROP INDEX "ChatMessage_userId_idx";

-- DropIndex
DROP INDEX "Feedback_userId_idx";

-- DropIndex
DROP INDEX "GigApplication_gigId_idx";

-- DropIndex
DROP INDEX "GigApplication_userId_idx";

-- AlterTable
ALTER TABLE "BudgetAllocation" DROP COLUMN "needs",
DROP COLUMN "savings",
DROP COLUMN "wants",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "period" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "mentorId",
DROP COLUMN "sender",
DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Deployment" DROP COLUMN "details",
DROP COLUMN "version";

-- AlterTable
ALTER TABLE "ErrorLog" DROP COLUMN "metadata",
DROP COLUMN "severity",
DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "deviceInfo",
DROP COLUMN "featuresUsed",
DROP COLUMN "performance",
DROP COLUMN "suggestions",
DROP COLUMN "timeSpent",
ADD COLUMN     "content" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GigApplication" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lifetimeAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "stripeSubscriptionStatus" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Mentor";

-- DropTable
DROP TABLE "MentorAvailability";

-- DropTable
DROP TABLE "MentorRating";

-- DropTable
DROP TABLE "stackzengig";

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigApplication" ADD CONSTRAINT "GigApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

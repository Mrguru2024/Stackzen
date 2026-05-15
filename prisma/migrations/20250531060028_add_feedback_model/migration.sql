/*
  Warnings:

  - You are about to drop the column `date` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `featureFeedback` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `generalComments` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `issues` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `testerId` on the `Feedback` table. All the data in the column will be lost.
  - Added the required column `rating` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suggestions` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Feedback_date_idx";

-- DropIndex
DROP INDEX "Feedback_testerId_idx";

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "date",
DROP COLUMN "featureFeedback",
DROP COLUMN "generalComments",
DROP COLUMN "issues",
DROP COLUMN "testerId",
ADD COLUMN     "rating" INTEGER NOT NULL,
ADD COLUMN     "suggestions" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
